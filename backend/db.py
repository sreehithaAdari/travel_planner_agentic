from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import uuid

SQLALCHEMY_DATABASE_URL = "sqlite:///./travel_planner.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, default="New Trip")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    itinerary_data = relationship("ItineraryData", back_populates="chat", uselist=False, cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String, ForeignKey("chats.id"))
    role = Column(String) # 'user' or 'ai'
    content = Column(Text)
    
    chat = relationship("Chat", back_populates="messages")

class ItineraryData(Base):
    __tablename__ = "itinerary_data"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String, ForeignKey("chats.id"), unique=True)
    destination = Column(String)
    days = Column(Integer)
    people = Column(Integer)
    adults = Column(Integer)
    children = Column(Integer)
    budget = Column(Float)
    currency = Column(String, default="USD")
    travel_type = Column(String)
    
    budget_sufficient = Column(Boolean)
    estimated_cost = Column(Float)
    final_itinerary = Column(Text)
    
    chat = relationship("Chat", back_populates="itinerary_data")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
