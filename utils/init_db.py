from .db_connect import get_connection


def main():
    conn = get_connection(include_db=False)
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS PlayerDB")
    conn.commit()
    cursor.close()
    conn.close()

    conn = get_connection()
    cursor = conn.cursor()

    for stmt in TABLES:
        cursor.execute(stmt)

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ All tables initialized successfully.")


TABLES = [
    """
    CREATE DATABASE IF NOT EXISTS PlayerDB
    """,
    """
    CREATE TABLE IF NOT EXISTS Nationality (
        NationalityID INT AUTO_INCREMENT PRIMARY KEY,
        NationalityName VARCHAR(255)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS Clubs (
        ClubID INT AUTO_INCREMENT PRIMARY KEY,
        NationalityID INT,
        LeagueName VARCHAR(255),
        ClubName VARCHAR(255),
        FOREIGN KEY (NationalityID) REFERENCES Nationality(NationalityID)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS PlayerStats (
        PlayerID INT AUTO_INCREMENT PRIMARY KEY,
        NationalityID INT,
        DOB DATE,
        Overall INT,
        Value INT,
        Name VARCHAR(255),
        ClubID INT,
        Pace INT,
        Physical INT,
        Shooting INT,
        Passing INT,
        Dribbling INT,
        Defending INT,
        FOREIGN KEY (NationalityID) REFERENCES Nationality(NationalityID),
        FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS GoalkeeperStats (
        PlayerID INT AUTO_INCREMENT PRIMARY KEY,
        NationalityID INT,
        DOB DATE,
        Overall INT,
        Value INT,
        Name VARCHAR(255),
        ClubID INT,
        Reflexes INT,
        Diving INT,
        Speed INT,
        Positioning INT,
        Handling INT,
        FOREIGN KEY (NationalityID) REFERENCES Nationality(NationalityID),
        FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS Contracts (
        ContractID INT AUTO_INCREMENT PRIMARY KEY,
        PlayerID INT,
        ClubID INT,
        DateOfJoin DATE,
        DateOfEnd DATE,
        ReleaseClause INT,
        UNIQUE KEY (PlayerID, ClubID),
        FOREIGN KEY (PlayerID) REFERENCES PlayerStats(PlayerID),
        FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID)
    )
    """,
]

if __name__ == "__main__":
    main()
