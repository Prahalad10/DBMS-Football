from fastapi import FastAPI, Depends, HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ariadne.asgi import GraphQL

from database import (
    SessionLocal,
    User, 
    PlayerStats, 
    GoalkeeperStats, 
    Clubs, 
    Nationality, 
    Contracts
)
from auth import decode_token, hash_password, verify_password, create_access_token
from schema import schema  # Import the GraphQL schema

app = FastAPI(title="Player Management System")

# Create the GraphQL app
graphql_app = GraphQL(schema, debug=True)

# Mount the GraphQL endpoint
app.mount("/graphql", graphql_app)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication dependency
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        return None
        
    try:
        token = authorization.split(" ")[1]
        payload = decode_token(token)
        if payload:
            username = payload.get("username")
            user = db.query(User).filter(User.username == username).first()
            return user
    except:
        pass
    
    return None

def get_admin_user(user: User = Depends(get_current_user)):
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str

@app.post("/register", response_model=dict)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user with this username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Always create regular users, not admins
    hashed_pw = hash_password(user.password)
    new_user = User(username=user.username, password=hashed_pw, role="user")
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/login", response_model=TokenResponse)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"username": db_user.username, "role": db_user.role})
    return {"token": token}

# Routes
@app.get("/users")
def get_users(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/players")
def get_players(db: Session = Depends(get_db)):
    return db.query(PlayerStats).all()

@app.get("/goalkeepers")
def get_goalkeepers(db: Session = Depends(get_db)):
    return db.query(GoalkeeperStats).all()

@app.get("/clubs")
def get_clubs(db: Session = Depends(get_db)):
    return db.query(Clubs).all()

@app.get("/nationalities")
def get_nationalities(db: Session = Depends(get_db)):
    return db.query(Nationality).all()

@app.get("/contracts")
def get_contracts(db: Session = Depends(get_db)):
    return db.query(Contracts).all()

# Run the application with:
# uvicorn main:app --reload
