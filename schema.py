from ariadne import (
    QueryType,
    MutationType,
    make_executable_schema,
    load_schema_from_path,
)
from database import (
    SessionLocal,
    User,
    PlayerStats,
    GoalkeeperStats,
    Clubs,
    Nationality,
    Contracts,
)
from auth import hash_password, verify_password, create_access_token, decode_token


db = SessionLocal()
query = QueryType()
mutation = MutationType()


def get_current_user(info):
    auth_header = info.context["request"].headers.get("Authorization")
    if not auth_header:
        return None
    token = auth_header.split(" ")[1]
    return decode_token(token)


@query.field("users")
def resolve_users(_, info):
    user = get_current_user(info)
    if user and user["role"] == "admin":
        return db.query(User).all()
    raise Exception("Not authorized!")


@query.field("playerStats")
def resolve_player_stats(_, info):
    return db.query(PlayerStats).all()


@query.field("goalkeeperStats")
def resolve_goalkeeper_stats(_, info):
    return db.query(GoalkeeperStats).all()


@query.field("clubs")
def resolve_clubs(_, info):
    return db.query(Clubs).all()


@query.field("nationalities")
def resolve_nationalities(_, info):
    return db.query(Nationality).all()


@query.field("contracts")
def resolve_contracts(_, info):
    return db.query(Contracts).all()


@mutation.field("createUser")
def resolve_create_user(_, info, username, password, role):
    hashed_pw = hash_password(password)
    new_user = User(username=username, password=hashed_pw, role=role)
    db.add(new_user)
    db.commit()
    return new_user


@mutation.field("loginUser")
def resolve_login_user(_, info, username, password):
    user = db.query(User).filter(User.username == username).first()
    if user and verify_password(password, user.password):
        return {
            "token": create_access_token({"username": user.username, "role": user.role})
        }
    raise Exception("Invalid credentials")


@mutation.field("createPlayer")
def resolve_create_player(_, info, **kwargs):
    user = get_current_user(info)
    if user and user["role"] == "admin":
        new_player = PlayerStats(**kwargs)
        db.add(new_player)
        db.commit()
        return new_player
    raise Exception("Not authorized")


@mutation.field("updatePlayer")
def resolve_update_player(_, info, playerID, **kwargs):
    user = get_current_user(info)
    if user and user["role"] == "admin":
        player = db.query(PlayerStats).filter_by(PlayerID=playerID).first()
        if not player:
            raise Exception("Player not found")
        for key, value in kwargs.items():
            setattr(player, key, value)
        db.commit()
        return player
    raise Exception("Not authorized")


@mutation.field("deletePlayer")
def resolve_delete_player(_, info, playerID):
    user = get_current_user(info)
    if user and user["role"] == "admin":
        player = db.query(PlayerStats).filter_by(PlayerID=playerID).first()
        if not player:
            raise Exception("Player not found")
        db.delete(player)
        db.commit()
        return True
    raise Exception("Not authorized")


type_defs = load_schema_from_path("schema.graphql")

schema = make_executable_schema(type_defs, query, mutation)
