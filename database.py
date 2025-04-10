from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)  # Ensure this column exists
    role = Column(String(50), nullable=False)


class Nationality(Base):
    __tablename__ = "nationality"
    NationalityID = Column(Integer, primary_key=True, autoincrement=True)
    NationalityName = Column(String)


class Clubs(Base):
    __tablename__ = "clubs"
    ClubID = Column(Integer, primary_key=True, autoincrement=True)
    NationalityID = Column(Integer, ForeignKey("nationality.NationalityID"))
    LeagueName = Column(String)
    ClubName = Column(String)


class PlayerStats(Base):
    __tablename__ = "playerstats"
    PlayerID = Column(Integer, primary_key=True, autoincrement=True)
    NationalityID = Column(Integer, ForeignKey("nationality.NationalityID"))
    DOB = Column(Date)
    Overall = Column(Integer)
    Value = Column(Integer)
    Name = Column(String)
    ClubID = Column(Integer, ForeignKey("clubs.ClubID"))
    Pace = Column(Integer)
    Physical = Column(Integer)
    Shooting = Column(Integer)
    Passing = Column(Integer)
    Dribbling = Column(Integer)
    Defending = Column(Integer)


class GoalkeeperStats(Base):
    __tablename__ = "goalkeeperstats"
    PlayerID = Column(Integer, primary_key=True, autoincrement=True)
    NationalityID = Column(Integer, ForeignKey("nationality.NationalityID"))
    DOB = Column(Date)
    Overall = Column(Integer)
    Value = Column(Integer)
    Name = Column(String)
    ClubID = Column(Integer, ForeignKey("clubs.ClubID"))
    Reflexes = Column(Integer)
    Diving = Column(Integer)
    Speed = Column(Integer)
    Positioning = Column(Integer)
    Handling = Column(Integer)


class Contracts(Base):
    __tablename__ = "contracts"
    PlayerID = Column(Integer, ForeignKey("playerstats.PlayerID"), primary_key=True)
    ClubID = Column(Integer, ForeignKey("clubs.ClubID"), primary_key=True)
    DateOfJoin = Column(Date)
    DateOfEnd = Column(Date)
    ReleaseClause = Column(Integer)


Base.metadata.create_all(bind=engine)
