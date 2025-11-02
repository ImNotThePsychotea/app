from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ===================== MODELS =====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    level: str = "beginner"
    total_score: int = 0

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    level: str
    total_score: int
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class GameProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    current_level: int = 1
    score: int = 0
    completed_challenges: List[str] = []
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChallengeSubmit(BaseModel):
    challenge_id: str
    prompt: str

class ChallengeResult(BaseModel):
    score: int
    feedback: str
    passed: bool

class QuizAnswer(BaseModel):
    question_id: str
    selected_answer: str

class QuizSubmit(BaseModel):
    quiz_level: str
    answers: List[QuizAnswer]

class QuizResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    quiz_level: str
    score: int
    total_questions: int
    answers: List[Dict[str, Any]]
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaderboardEntry(BaseModel):
    username: str
    score: int
    level: int
    rank: int

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# ===================== AI SERVICE =====================

async def get_ai_response(message: str, session_id: str, system_message: str = None) -> str:
    """Get AI response using emergentintegrations"""
    try:
        if system_message is None:
            system_message = """You are an expert AI Tutor for Synergi AI platform. 
            Your mission is to teach prompt engineering and AI concepts in a clear, engaging way. 
            Help users master the synergy between human creativity and AI capabilities.
            Be professional, encouraging, and provide practical examples."""
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)
        
        return response
    except Exception as e:
        logging.error(f"AI Service Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one(
        {"$or": [{"email": user_data.email}, {"username": user_data.username}]},
        {"_id": 0}
    )
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    
    # Save to DB
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create initial game progress
    game_progress = GameProgress(user_id=user.id)
    progress_dict = game_progress.model_dump()
    progress_dict['last_updated'] = progress_dict['last_updated'].isoformat()
    await db.game_progress.insert_one(progress_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            level=user.level,
            total_score=user.total_score,
            created_at=user.created_at.isoformat()
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    # Find user
    user_dict = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    
    if not user_dict:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert timestamp
    if isinstance(user_dict['created_at'], str):
        user_dict['created_at'] = datetime.fromisoformat(user_dict['created_at'])
    
    user = User(**user_dict)
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            level=user.level,
            total_score=user.total_score,
            created_at=user.created_at.isoformat()
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        level=current_user.level,
        total_score=current_user.total_score,
        created_at=current_user.created_at.isoformat()
    )

# ===================== AI TUTOR ENDPOINTS =====================

@api_router.post("/ai/tutor", response_model=ChatResponse)
async def ai_tutor(chat_req: ChatRequest, current_user: User = Depends(get_current_user)):
    # Generate session ID if not provided
    session_id = chat_req.session_id or str(uuid.uuid4())
    
    # Save user message
    user_msg = ChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="user",
        content=chat_req.message
    )
    user_msg_dict = user_msg.model_dump()
    user_msg_dict['timestamp'] = user_msg_dict['timestamp'].isoformat()
    await db.chat_messages.insert_one(user_msg_dict)
    
    # Get AI response
    ai_response = await get_ai_response(chat_req.message, session_id)
    
    # Save AI message
    ai_msg = ChatMessage(
        user_id=current_user.id,
        session_id=session_id,
        role="assistant",
        content=ai_response
    )
    ai_msg_dict = ai_msg.model_dump()
    ai_msg_dict['timestamp'] = ai_msg_dict['timestamp'].isoformat()
    await db.chat_messages.insert_one(ai_msg_dict)
    
    return ChatResponse(response=ai_response, session_id=session_id)

@api_router.get("/ai/history/{session_id}")
async def get_chat_history(session_id: str, current_user: User = Depends(get_current_user)):
    messages = await db.chat_messages.find(
        {"user_id": current_user.id, "session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    return {"messages": messages}

# ===================== GAME ENDPOINTS =====================

@api_router.get("/game/challenges")
async def get_challenges():
    """Get available game challenges"""
    # In a real app, this would be from DB
    # For now, return static data structure
    return {
        "challenges": [
            {
                "id": "1",
                "level": 1,
                "title": "First Contact",
                "description": "Create a prompt that makes the AI introduce itself as a friendly tutor",
                "scenario": "You need the AI to act as a welcoming tutor for beginners",
                "requirements": ["Friendly tone", "Introduce as tutor", "Mention AI expertise"],
                "min_score": 70
            },
            {
                "id": "2",
                "level": 2,
                "title": "Specificity Master",
                "description": "Write a prompt that gets a detailed explanation of neural networks",
                "scenario": "You want to understand neural networks at a technical level",
                "requirements": ["Request detailed explanation", "Specify technical depth", "Ask for examples"],
                "min_score": 75
            },
            {
                "id": "3",
                "level": 3,
                "title": "Context Builder",
                "description": "Create a prompt with rich context for a coding task",
                "scenario": "You need the AI to write Python code with specific requirements",
                "requirements": ["Provide context", "Specify language", "Define requirements clearly"],
                "min_score": 80
            },
            {
                "id": "4",
                "level": 4,
                "title": "Role Assignment",
                "description": "Assign the AI a specific expert role and get domain advice",
                "scenario": "You need advice from a data science expert perspective",
                "requirements": ["Assign specific role", "Request expert perspective", "Ask relevant question"],
                "min_score": 85
            },
            {
                "id": "5",
                "level": 5,
                "title": "Output Format Specialist",
                "description": "Get the AI to provide structured output in a specific format",
                "scenario": "You need information organized as a table or list",
                "requirements": ["Specify format", "Request structure", "Define columns/fields"],
                "min_score": 90
            }
        ]
    }

@api_router.post("/game/submit", response_model=ChallengeResult)
async def submit_challenge(
    submission: ChallengeSubmit,
    current_user: User = Depends(get_current_user)
):
    """Submit a prompt for challenge evaluation"""
    
    # Evaluate prompt quality using AI
    evaluation_prompt = f"""Evaluate this prompt for a prompt engineering challenge:

Challenge ID: {submission.challenge_id}
User's Prompt: {submission.prompt}

Evaluate based on:
1. Clarity and specificity (0-25 points)
2. Context provided (0-25 points)
3. Structure and formatting (0-25 points)
4. Effectiveness for intended goal (0-25 points)

Provide a JSON response with:
{{
    "score": <total score 0-100>,
    "feedback": "<detailed feedback>",
    "passed": <true if score >= 70>
}}
"""
    
    try:
        ai_evaluation = await get_ai_response(
            evaluation_prompt,
            f"eval_{submission.challenge_id}_{current_user.id}",
            "You are a prompt engineering evaluator. Provide objective, constructive feedback."
        )
        
        # Parse AI response (simple parsing - in production use more robust method)
        import json
        # Extract JSON from response
        start = ai_evaluation.find('{')
        end = ai_evaluation.rfind('}') + 1
        if start != -1 and end > start:
            result_json = json.loads(ai_evaluation[start:end])
        else:
            # Fallback if parsing fails
            result_json = {"score": 70, "feedback": "Good effort!", "passed": True}
        
        # Update game progress
        progress = await db.game_progress.find_one({"user_id": current_user.id}, {"_id": 0})
        if progress:
            new_score = progress.get('score', 0) + result_json['score']
            completed = progress.get('completed_challenges', [])
            if submission.challenge_id not in completed:
                completed.append(submission.challenge_id)
            
            await db.game_progress.update_one(
                {"user_id": current_user.id},
                {
                    "$set": {
                        "score": new_score,
                        "completed_challenges": completed,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Update user total score
            await db.users.update_one(
                {"id": current_user.id},
                {"$set": {"total_score": new_score}}
            )
        
        return ChallengeResult(
            score=result_json['score'],
            feedback=result_json['feedback'],
            passed=result_json['passed']
        )
    
    except Exception as e:
        logging.error(f"Challenge evaluation error: {str(e)}")
        # Fallback scoring
        score = 75
        return ChallengeResult(
            score=score,
            feedback="Your prompt shows good effort. Keep practicing to improve clarity and specificity!",
            passed=score >= 70
        )

@api_router.get("/game/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard():
    """Get top players leaderboard"""
    
    # Get all game progress sorted by score
    progress_list = await db.game_progress.find({}, {"_id": 0}).sort("score", -1).limit(10).to_list(10)
    
    leaderboard = []
    rank = 1
    
    for progress in progress_list:
        user = await db.users.find_one({"id": progress['user_id']}, {"_id": 0})
        if user:
            leaderboard.append(LeaderboardEntry(
                username=user['username'],
                score=progress.get('score', 0),
                level=progress.get('current_level', 1),
                rank=rank
            ))
            rank += 1
    
    return leaderboard

@api_router.get("/user/progress")
async def get_user_progress(current_user: User = Depends(get_current_user)):
    """Get user's game progress"""
    progress = await db.game_progress.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not progress:
        return {"score": 0, "current_level": 1, "completed_challenges": []}
    
    return progress

# ===================== QUIZ ENDPOINTS =====================

@api_router.get("/quiz/{level}")
async def get_quiz(level: str):
    """Get quiz questions for a level"""
    # In production, load from file or DB
    # For now, return sample questions
    
    if level == "beginner":
        return {
            "level": "beginner",
            "questions": [
                {
                    "id": "q1",
                    "question": "What is prompt engineering?",
                    "options": [
                        "Writing code for AI models",
                        "Crafting effective instructions for AI systems",
                        "Building AI hardware",
                        "Training neural networks"
                    ],
                    "correct": 1
                },
                {
                    "id": "q2",
                    "question": "Which element makes a prompt more effective?",
                    "options": [
                        "Being vague and general",
                        "Using complex jargon",
                        "Providing clear context and specific instructions",
                        "Making it as short as possible"
                    ],
                    "correct": 2
                },
                {
                    "id": "q3",
                    "question": "What is 'few-shot learning' in prompting?",
                    "options": [
                        "Using very short prompts",
                        "Providing examples in your prompt",
                        "Training the AI with limited data",
                        "Asking multiple questions at once"
                    ],
                    "correct": 1
                }
            ]
        }
    else:  # advanced
        return {
            "level": "advanced",
            "questions": [
                {
                    "id": "q1",
                    "question": "What is 'chain-of-thought' prompting?",
                    "options": [
                        "Asking multiple unrelated questions",
                        "Guiding the AI to show its reasoning process step-by-step",
                        "Creating a series of prompts in sequence",
                        "Using logical operators in prompts"
                    ],
                    "correct": 1
                },
                {
                    "id": "q2",
                    "question": "What is the primary benefit of role-based prompting?",
                    "options": [
                        "Making the AI respond faster",
                        "Reducing token usage",
                        "Getting responses from a specific expertise perspective",
                        "Avoiding hallucinations completely"
                    ],
                    "correct": 2
                },
                {
                    "id": "q3",
                    "question": "What technique helps reduce AI hallucinations?",
                    "options": [
                        "Using shorter prompts",
                        "Asking for sources and being specific about constraints",
                        "Increasing temperature settings",
                        "Removing all context from prompts"
                    ],
                    "correct": 1
                }
            ]
        }

@api_router.post("/quiz/submit")
async def submit_quiz(
    quiz_data: QuizSubmit,
    current_user: User = Depends(get_current_user)
):
    """Submit quiz answers and get score"""
    
    # Get correct answers (in production, from DB)
    correct_answers = {
        "beginner": {"q1": 1, "q2": 2, "q3": 1},
        "advanced": {"q1": 1, "q2": 2, "q3": 1}
    }
    
    correct = correct_answers.get(quiz_data.quiz_level, {})
    score = 0
    total = len(quiz_data.answers)
    detailed_results = []
    
    for answer in quiz_data.answers:
        is_correct = correct.get(answer.question_id) == int(answer.selected_answer)
        if is_correct:
            score += 1
        detailed_results.append({
            "question_id": answer.question_id,
            "correct": is_correct
        })
    
    # Save result
    quiz_result = QuizResult(
        user_id=current_user.id,
        quiz_level=quiz_data.quiz_level,
        score=score,
        total_questions=total,
        answers=detailed_results
    )
    
    result_dict = quiz_result.model_dump()
    result_dict['completed_at'] = result_dict['completed_at'].isoformat()
    await db.quiz_results.insert_one(result_dict)
    
    # Update user level if passed advanced
    if quiz_data.quiz_level == "advanced" and score >= 2:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"level": "advanced"}}
        )
    
    return {
        "score": score,
        "total": total,
        "percentage": (score / total * 100) if total > 0 else 0,
        "passed": score >= (total * 0.7),
        "details": detailed_results
    }

# ===================== BASIC ENDPOINTS =====================

@api_router.get("/")
async def root():
    return {"message": "Synergi AI API - Master the future of Prompt Engineering"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()