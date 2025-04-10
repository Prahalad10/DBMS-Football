import mysql.connector
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG


def get_connection(include_db=True):
    config = DB_CONFIG.copy()
    if not include_db:
        config.pop("database", None)
    return mysql.connector.connect(**config)
