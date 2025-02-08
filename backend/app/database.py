from sqlite3 import connect
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import text
from sqlalchemy import Column, String, DateTime, UUID
import uuid
from datetime import datetime 
from sqlalchemy.orm.session import Session
from typing import Any, Optional

engine = create_engine("postgresql://postgres:postgres@localhost:5432/publicdb")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class Users(Base):
    __tablename__ = 'users'

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    name = Column(String)
    username = Column(String, unique=True)
    password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# get user by username

async def get_user_by_username(db: Session, username: str):
    user = db.query(Users).where(Users.username == username).first()
    if not user:
        return None
    return user

async def insert(db:Session, entity: Any):
    db.add(entity)
    db.commit()
    db.refresh(entity)