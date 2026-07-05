import re
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional

from database import get_user_by_username, get_user_by_email, create_user
from services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


def validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


@router.post("/register")
async def register(body: RegisterRequest):
    if not validate_email(body.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if len(body.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")

    existing_user = await get_user_by_username(body.username)
    if existing_user:
        raise HTTPException(status_code=409, detail="Username already taken")

    existing_email = await get_user_by_email(body.email)
    if existing_email:
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = hash_password(body.password)
    user_id = await create_user(body.username, body.email, hashed, body.full_name)

    token = create_access_token(user_id, body.username)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": body.username,
            "email": body.email,
            "full_name": body.full_name,
        },
    }


@router.post("/login")
async def login(body: LoginRequest):
    user = await get_user_by_username(body.username)
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(user["id"], user["username"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
        },
    }


@router.post("/logout")
async def logout():
    return {"message": "logged out"}


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "created_at": current_user["created_at"],
    }
