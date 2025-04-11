from fastapi import FastAPI, Depends, HTTPException, Response, Request
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from typing import Optional
from sqlalchemy import text
from database import (
    SessionLocal,
    User, 
    PlayerStats, 
    Clubs,
    Base,  # Import Base for table creation
    OutfieldStats  # Import the new model
)
from auth import hash_password, verify_password
from sqlalchemy import create_engine

app = FastAPI(title="Player Management System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_raw_query(db: Session, query: str, params: dict = None):
    result = db.execute(text(query), params if params else {})
    column_names = result.keys()
    return [dict(zip(column_names, row)) for row in result]

# Ensure all tables are created
DATABASE_URL = f"mysql+pymysql://player_user:123@localhost/playerdb"

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ContractCreate(BaseModel):
    player_id: int
    club_id: int
    date_of_join: date
    date_of_end: date
    release_clause: int

class PlayerTransfer(BaseModel):
    player_id: int
    new_club_id: int
    contract_start: date
    contract_end: date
    release_clause: int

class PlayerSearchParams(BaseModel):
    starts_with: str
    nationality: Optional[str] = None
    club: Optional[str] = None
    outfield_players: bool = False
    goal_keepers: bool = False

@app.post("/register")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user with this username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Always create regular users with the role "user"
    hashed_pw = hash_password(user.password)
    new_user = User(username=user.username, password=hashed_pw, role="user")
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "message": "Login successful",
        "user": {
            "username": db_user.username,
            "role": db_user.role
        }
    }

@app.get("/players")
def get_players(db: Session = Depends(get_db)):
    return db.query(PlayerStats).all()

@app.get("/clubs")
def get_clubs(db: Session = Depends(get_db)):
    return db.query(Clubs).all()

@app.get("/all-players")
def get_all_players(db: Session = Depends(get_db)):
    query = """
    SELECT 
        p.PlayerID,
        p.Name,
        p.DOB,
        p.Overall,
        p.Value,
        p.ClubID,
        c.ClubName,
        c.LeagueName,
        n.NationalityID,
        n.NationalityName,
        c.ClubID as "Club.ClubID",
        c.ClubName as "Club.ClubName",
        c.LeagueName as "Club.LeagueName",
        n.NationalityID as "Nationality.NationalityID",
        n.NationalityName as "Nationality.NationalityName",
        CASE 
            WHEN g.PlayerID IS NOT NULL THEN 'Goalkeeper'
            ELSE 'Outfield'
        END as Position
    FROM playerstats p 
    LEFT JOIN clubs c ON p.ClubID = c.ClubID 
    LEFT JOIN nationality n ON p.NationalityID = n.NationalityID
    LEFT JOIN goalkeeperstats g ON p.PlayerID = g.PlayerID
    LIMIT 100
    """
    result = execute_raw_query(db, query)
    
    # Transform the data to match frontend expectations
    formatted_results = []
    for row in result:
        formatted_row = {
            'PlayerID': row['PlayerID'],
            'Name': row['Name'],
            'DOB': row['DOB'],
            'Overall': row['Overall'],
            'Value': row['Value'],
            'Position': row['Position'],
            'Club': {
                'ClubID': row['Club.ClubID'],
                'ClubName': row['Club.ClubName'],
                'LeagueName': row['Club.LeagueName']
            },
            'Nationality': {
                'NationalityID': row['Nationality.NationalityID'],
                'NationalityName': row['Nationality.NationalityName']
            }
        }
        formatted_results.append(formatted_row)
    
    return formatted_results

@app.get("/all-nationalities")
def get_nationalities(db: Session = Depends(get_db)):
    query = """
    SELECT 
        NationalityID,
        NationalityName
    FROM nationality
    ORDER BY NationalityName
    """
    return execute_raw_query(db, query)

@app.get("/all-clubs")
def get_all_clubs(db: Session = Depends(get_db)):
    query = """
    SELECT 
        c.ClubID,
        c.ClubName,
        c.LeagueName,
        c.NationalityID,
        n.NationalityName
    FROM clubs c 
    LEFT JOIN nationality n ON c.NationalityID = n.NationalityID
    ORDER BY c.ClubName
    """
    return execute_raw_query(db, query)

@app.get("/clubs/{club_id}")
def get_club_details(club_id: int, db: Session = Depends(get_db)):
    # First get club details
    club_query = """
    SELECT 
        c.ClubID,
        c.ClubName,
        c.LeagueName,
        n.NationalityID,
        n.NationalityName,
        (
            SELECT COUNT(*)
            FROM playerstats p
            WHERE p.ClubID = c.ClubID
        ) as SquadSize
    FROM clubs c
    LEFT JOIN nationality n ON c.NationalityID = n.NationalityID
    WHERE c.ClubID = :club_id
    """
    
    club_result = execute_raw_query(db, club_query, {"club_id": club_id})
    if not club_result:
        raise HTTPException(status_code=404, detail="Club not found")

    club_data = club_result[0]
    
    # Get players in the club, including goalkeepers
    players_query = """
    SELECT 
        p.PlayerID,
        p.Name,
        p.Overall,
        p.Value,
        CASE 
            WHEN g.PlayerID IS NOT NULL THEN 'Goalkeeper'
            ELSE 'Outfield'
        END as Position,
        g.Reflexes,
        g.Diving,
        g.Handling,
        g.Positioning,
        g.Speed,
        os.Pace,
        os.Shooting,
        os.Passing,
        os.Dribbling,
        os.Defending,
        os.Physical
    FROM playerstats p
    LEFT JOIN goalkeeperstats g ON p.PlayerID = g.PlayerID
    LEFT JOIN outfieldstats os ON p.PlayerID = os.PlayerID
    WHERE p.ClubID = :club_id
    """
    
    players_result = execute_raw_query(db, players_query, {"club_id": club_id})
    
    # Format the response
    formatted_response = {
        'ClubID': club_data['ClubID'],
        'ClubName': club_data['ClubName'],
        'LeagueName': club_data['LeagueName'],
        'SquadSize': club_data['SquadSize'],
        'Nationality': {
            'NationalityID': club_data['NationalityID'],
            'NationalityName': club_data['NationalityName']
        },
        'players': players_result
    }
    
    return formatted_response

@app.get("/clubs/{club_id}/goalkeepers")
def get_goalkeepers_by_club(club_id: int, db: Session = Depends(get_db)):
    query = """
    SELECT 
        p.PlayerID,
        p.Name,
        p.Overall,
        p.Value,
        g.Reflexes,
        g.Diving,
        g.Handling,
        g.Positioning,
        g.Speed
    FROM playerstats p
    JOIN goalkeeperstats g ON p.PlayerID = g.PlayerID
    WHERE p.ClubID = :club_id
    """
    return execute_raw_query(db, query, {"club_id": club_id})

@app.get("/clubs/{club_id}/contracts")
def get_contracts_by_club(club_id: int, db: Session = Depends(get_db)):
    query = """
    SELECT 
        c.PlayerID,
        p.Name as PlayerName,
        c.DateOfJoin,
        c.DateOfEnd,
        c.ReleaseClause
    FROM contracts c
    JOIN playerstats p ON c.PlayerID = p.PlayerID
    WHERE c.ClubID = :club_id
    """
    return execute_raw_query(db, query, {"club_id": club_id})

@app.get("/clubs/{club_id}/outfield-players")
def get_outfield_players_by_club(club_id: int, db: Session = Depends(get_db)):
    query = """
    SELECT 
        p.PlayerID,
        p.Name,
        p.Overall,
        p.Value,
        os.Pace,
        os.Shooting,
        os.Passing,
        os.Dribbling,
        os.Defending,
        os.Physical
    FROM playerstats p
    JOIN outfieldstats os ON p.PlayerID = os.PlayerID
    WHERE p.ClubID = :club_id
    """
    return execute_raw_query(db, query, {"club_id": club_id})

@app.get("/player-contracts")
def get_contracts(db: Session = Depends(get_db)):
    query = """
    SELECT c.*, p.Name as PlayerName, cl.ClubName 
    FROM contracts c 
    JOIN playerstats p ON c.PlayerID = p.PlayerID 
    JOIN clubs cl ON c.ClubID = cl.ClubID
    LIMIT 100
    """
    return execute_raw_query(db, query)

@app.get("/player/{player_id}")
def get_player_details(player_id: int, db: Session = Depends(get_db)):
    query = """
    SELECT 
        p.PlayerID,
        p.Name,
        p.DOB,
        p.Overall,
        p.Value,
        p.ClubID,
        p.NationalityID,
        c.ClubName,
        c.LeagueName,
        n.NationalityName,
        CASE 
            WHEN g.PlayerID IS NOT NULL THEN 'Goalkeeper'
            ELSE 'Outfield'
        END as Position,
        COALESCE(g.Reflexes, os.Pace) as Pace,
        COALESCE(g.Diving, os.Shooting) as Shooting,
        COALESCE(g.Handling, os.Passing) as Passing,
        COALESCE(g.Positioning, os.Dribbling) as Dribbling,
        COALESCE(g.Speed, os.Defending) as Defending,
        COALESCE(NULL, os.Physical) as Physical,
        g.Reflexes,
        g.Diving,
        g.Handling,
        g.Positioning,
        g.Speed
    FROM playerstats p 
    LEFT JOIN clubs c ON p.ClubID = c.ClubID 
    LEFT JOIN nationality n ON p.NationalityID = n.NationalityID 
    LEFT JOIN goalkeeperstats g ON p.PlayerID = g.PlayerID
    LEFT JOIN playerstats os ON p.PlayerID = os.PlayerID
    WHERE p.PlayerID = :player_id
    """
    result = execute_raw_query(db, query, {"player_id": player_id})
    if not result:
        raise HTTPException(status_code=404, detail="Player not found")

    player_data = result[0]
    
    # Format the response with proper nesting
    formatted_data = {
        'PlayerID': player_data['PlayerID'],
        'Name': player_data['Name'],
        'DOB': player_data['DOB'],
        'Overall': player_data['Overall'],
        'Value': player_data['Value'],
        'Position': player_data['Position'],
        'Club': {
            'ClubID': player_data['ClubID'],
            'ClubName': player_data['ClubName'],
            'LeagueName': player_data['LeagueName']
        },
        'Nationality': {
            'NationalityID': player_data['NationalityID'],
            'NationalityName': player_data['NationalityName']
        }
    }
    
    # Add stats based on position
    if player_data['Position'] == 'Goalkeeper':
        formatted_data.update({
            'Reflexes': player_data['Reflexes'],
            'Diving': player_data['Diving'],
            'Handling': player_data['Handling'],
            'Positioning': player_data['Positioning'],
            'Speed': player_data['Speed']
        })
    else:
        formatted_data.update({
            'Pace': player_data['Pace'],
            'Shooting': player_data['Shooting'],
            'Passing': player_data['Passing'],
            'Dribbling': player_data['Dribbling'],
            'Defending': player_data['Defending'],
            'Physical': player_data['Physical']
        })
    
    return formatted_data

@app.post("/contracts/new")
def create_contract(
    contract: ContractCreate,
    db: Session = Depends(get_db)
):
    query = """
    INSERT INTO contracts (PlayerID, ClubID, DateOfJoin, DateOfEnd, ReleaseClause)
    VALUES (:player_id, :club_id, :date_of_join, :date_of_end, :release_clause)
    """
    try:
        db.execute(
            text(query),
            {
                "player_id": contract.player_id,
                "club_id": contract.club_id,
                "date_of_join": contract.date_of_join,
                "date_of_end": contract.date_of_end,
                "release_clause": contract.release_clause
            }
        )
        
        # Update player's club
        update_query = """
        UPDATE playerstats 
        SET ClubID = :club_id 
        WHERE PlayerID = :player_id
        """
        db.execute(
            text(update_query),
            {"club_id": contract.club_id, "player_id": contract.player_id}
        )
        
        db.commit()
        return {"message": "Contract created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/transfer-player")
def transfer_player(
    transfer: PlayerTransfer,
    db: Session = Depends(get_db)
):
    try:
        # End current contract
        end_contract_query = """
        UPDATE contracts 
        SET DateOfEnd = CURRENT_DATE 
        WHERE PlayerID = :player_id AND DateOfEnd > CURRENT_DATE
        """
        db.execute(text(end_contract_query), {"player_id": transfer.player_id})
        
        # Create new contract
        new_contract_query = """
        INSERT INTO contracts (PlayerID, ClubID, DateOfJoin, DateOfEnd, ReleaseClause)
        VALUES (:player_id, :club_id, :date_join, :date_end, :release_clause)
        """
        db.execute(
            text(new_contract_query),
            {
                "player_id": transfer.player_id,
                "club_id": transfer.new_club_id,
                "date_join": transfer.contract_start,
                "date_end": transfer.contract_end,
                "release_clause": transfer.release_clause
            }
        )
        
        # Update player's club
        update_player_query = """
        UPDATE playerstats 
        SET ClubID = :club_id 
        WHERE PlayerID = :player_id
        """
        db.execute(
            text(update_player_query),
            {"club_id": transfer.new_club_id, "player_id": transfer.player_id}
        )
        
        db.commit()
        return {"message": "Player transferred successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/player_route")
def search_players(params: PlayerSearchParams, db: Session = Depends(get_db)):
    # Fetch outfield players
    outfield_query = """
    SELECT 
        p.PlayerID,
        p.Name,
        p.DOB,
        p.Overall,
        p.Value,
        c.ClubID as "Club.ClubID",
        c.ClubName as "Club.ClubName",
        c.LeagueName as "Club.LeagueName",
        n.NationalityID as "Nationality.NationalityID",
        n.NationalityName as "Nationality.NationalityName",
        'Outfield' as Position
    FROM playerstats p
    LEFT JOIN outfieldstats os ON p.PlayerID = os.PlayerID
    LEFT JOIN clubs c ON p.ClubID = c.ClubID
    LEFT JOIN nationality n ON p.NationalityID = n.NationalityID
    WHERE p.Name LIKE :name_pattern
    AND (:nationality_id IS NULL OR n.NationalityID = :nationality_id)
    AND (:club_id IS NULL OR c.ClubID = :club_id)
    LIMIT 50
    """
    outfield_players = execute_raw_query(
        db,
        outfield_query,
        {
            "name_pattern": f"%{params.starts_with}%",
            "nationality_id": params.nationality if params.nationality != "any" else None,
            "club_id": params.club if params.club != "any" else None,
        },
    )

    # Fetch goalkeepers
    goalkeeper_query = """
    SELECT 
        p.PlayerID,
        p.Name,
        p.DOB,
        p.Overall,
        p.Value,
        c.ClubID as "Club.ClubID",
        c.ClubName as "Club.ClubName",
        c.LeagueName as "Club.LeagueName",
        n.NationalityID as "Nationality.NationalityID",
        n.NationalityName as "Nationality.NationalityName",
        'Goalkeeper' as Position
    FROM playerstats p
    LEFT JOIN goalkeeperstats g ON p.PlayerID = g.PlayerID
    LEFT JOIN clubs c ON p.ClubID = c.ClubID
    LEFT JOIN nationality n ON p.NationalityID = n.NationalityID
    WHERE p.Name LIKE :name_pattern
    AND (:nationality_id IS NULL OR n.NationalityID = :nationality_id)
    AND (:club_id IS NULL OR c.ClubID = :club_id)
    LIMIT 50
    """
    goalkeepers = execute_raw_query(
        db,
        goalkeeper_query,
        {
            "name_pattern": f"%{params.starts_with}%",
            "nationality_id": params.nationality if params.nationality != "any" else None,
            "club_id": params.club if params.club != "any" else None,
        },
    )

    # Concatenate results
    players = []
    if params.outfield_players:
        players.extend(outfield_players)
    if params.goal_keepers:
        players.extend(goalkeepers)

    return players

@app.post("/goalkeeper_route")
def search_goalkeepers(params: PlayerSearchParams, db: Session = Depends(get_db)):
    goalkeeper_query = """
    SELECT 
        p.PlayerID,
        p.Name,
        p.DOB,
        p.Overall,
        p.Value,
        c.ClubID as "Club.ClubID",
        c.ClubName as "Club.ClubName",
        c.LeagueName as "Club.LeagueName",
        n.NationalityID as "Nationality.NationalityID",
        n.NationalityName as "Nationality.NationalityName",
        'Goalkeeper' as Position,
        g.Reflexes,
        g.Diving,
        g.Handling,
        g.Positioning,
        g.Speed
    FROM playerstats p
    JOIN goalkeeperstats g ON p.PlayerID = g.PlayerID
    LEFT JOIN clubs c ON p.ClubID = c.ClubID
    LEFT JOIN nationality n ON p.NationalityID = n.NationalityID
    WHERE p.Name LIKE :name_pattern
    AND (:nationality_id = 'any' OR :nationality_id = '0' OR n.NationalityID = :nationality_id)
    AND (:club_id = 'any' OR :club_id = '0' OR c.ClubID = :club_id)
    LIMIT 50
    """
    
    result = execute_raw_query(
        db,
        goalkeeper_query,
        {
            "name_pattern": f"%{params.starts_with}%",
            "nationality_id": params.nationality,
            "club_id": params.club,
        },
    )
    
    # Format the response with proper nesting
    formatted_results = []
    for row in result:
        formatted_row = {
            'PlayerID': row['PlayerID'],
            'Name': row['Name'],
            'DOB': row['DOB'],
            'Overall': row['Overall'],
            'Value': row['Value'],
            'Position': row['Position'],
            'Club': {
                'ClubID': row['Club.ClubID'],
                'ClubName': row['Club.ClubName'],
                'LeagueName': row['Club.LeagueName']
            },
            'Nationality': {
                'NationalityID': row['Nationality.NationalityID'],
                'NationalityName': row['Nationality.NationalityName']
            },
            'Reflexes': row['Reflexes'],
            'Diving': row['Diving'],
            'Handling': row['Handling'],
            'Positioning': row['Positioning'],
            'Speed': row['Speed']
        }
        formatted_results.append(formatted_row)
    
    return formatted_results
