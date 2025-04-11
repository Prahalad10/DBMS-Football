import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "player_user"),
    "password": os.getenv("DB_PASSWORD", "123"),
    "database": os.getenv("DB_NAME", "playerdb"),
}


def get_connection(include_db=True):
    config = DB_CONFIG.copy()
    if not include_db:
        config.pop("database", None)
    return mysql.connector.connect(**config)
