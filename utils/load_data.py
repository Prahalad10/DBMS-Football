import pandas as pd
from .db_connect import get_connection
from datetime import datetime


def main():
    conn = get_connection(include_db=False)
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS playerdb")
    conn.commit()
    cursor.close()
    conn.close()

    conn = get_connection()
    cursor = conn.cursor()

    df = pd.read_csv("datasets/male_players.csv", low_memory=False)

    nationality_df = df[["nationality_id", "nationality_name"]].drop_duplicates()
    for _, row in nationality_df.iterrows():
        cursor.execute(
            """
            INSERT IGNORE INTO Nationality (NationalityID, NationalityName)
            VALUES (%s, %s)
        """,
            (int(row["nationality_id"]), row["nationality_name"]),
        )

    clubs_df = df[
        ["club_team_id", "club_name", "nationality_id", "league_name"]
    ].drop_duplicates()
    for _, row in clubs_df.iterrows():
        if pd.notnull(row["club_team_id"]):
            cursor.execute(
                """
                INSERT IGNORE INTO Clubs (ClubID, ClubName, NationalityID, LeagueName)
                VALUES (%s, %s, %s, %s)
            """,
                (
                    int(row["club_team_id"]),
                    row["club_name"],
                    int(row["nationality_id"])
                    if pd.notnull(row["nationality_id"])
                    else None,
                    row["league_name"],
                ),
            )

    # Step 6: Insert PlayerStats or GoalkeeperStats
    for _, row in df.iterrows():
        player_id = int(row["player_id"])
        name = row["short_name"]
        dob = (
            pd.to_datetime(row["dob"], errors="coerce").date()
            if pd.notnull(row["dob"])
            else None
        )
        overall = int(row["overall"]) if pd.notnull(row["overall"]) else None
        nationality_id = (
            int(row["nationality_id"]) if pd.notnull(row["nationality_id"]) else None
        )
        value = int(row["value_eur"]) if pd.notnull(row["value_eur"]) else 0
        club_id = int(row["club_team_id"]) if pd.notnull(row["club_team_id"]) else None

        if row["player_positions"].startswith("GK"):
            # Goalkeeper
            cursor.execute(
                """
                INSERT IGNORE INTO GoalkeeperStats (
                    PlayerID, Name, DOB, Overall, Value, NationalityID, ClubID,
                    Reflexes, Diving, Speed, Positioning, Handling
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    player_id,
                    name,
                    dob,
                    overall,
                    value,
                    nationality_id,
                    club_id,
                    int(row["goalkeeping_reflexes"])
                    if pd.notnull(row["goalkeeping_reflexes"])
                    else 0,
                    int(row["goalkeeping_diving"])
                    if pd.notnull(row["goalkeeping_diving"])
                    else 0,
                    int(row["goalkeeping_speed"])
                    if pd.notnull(row["goalkeeping_speed"])
                    else 0,
                    int(row["goalkeeping_positioning"])
                    if pd.notnull(row["goalkeeping_positioning"])
                    else 0,
                    int(row["goalkeeping_handling"])
                    if pd.notnull(row["goalkeeping_handling"])
                    else 0,
                ),
            )
        else:
            # Outfield player
            cursor.execute(
                """
                INSERT IGNORE INTO PlayerStats (
                    PlayerID, Name, DOB, Overall, Value, NationalityID, ClubID,
                    Pace, Physical, Shooting, Passing, Dribbling, Defending
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    player_id,
                    name,
                    dob,
                    overall,
                    value,
                    nationality_id,
                    club_id,
                    int(row["pace"]) if pd.notnull(row["pace"]) else 0,
                    int(row["physic"]) if pd.notnull(row["physic"]) else 0,
                    int(row["shooting"]) if pd.notnull(row["shooting"]) else 0,
                    int(row["passing"]) if pd.notnull(row["passing"]) else 0,
                    int(row["dribbling"]) if pd.notnull(row["dribbling"]) else 0,
                    int(row["defending"]) if pd.notnull(row["defending"]) else 0,
                ),
            )

        # Insert contract data if applicable
        if pd.notnull(row["club_joined_date"]) and pd.notnull(
            row["club_contract_valid_until_year"]
        ):
            try:
                joined = pd.to_datetime(row["club_joined_date"], errors="coerce").date()
                end_date = datetime(
                    year=int(row["club_contract_valid_until_year"]), month=6, day=30
                ).date()
                release_clause = (
                    int(row["release_clause_eur"])
                    if pd.notnull(row["release_clause_eur"])
                    else 0
                )

                cursor.execute(
                    """
                    INSERT IGNORE INTO Contracts (
                        PlayerID, ClubID, DateOfJoin, DateOfEnd, ReleaseClause
                    ) VALUES (%s, %s, %s, %s, %s)
                """,
                    (player_id, club_id, joined, end_date, release_clause),
                )
            except Exception as e:
                print(f"Error inserting contract for player {player_id}: {e}")

    conn.commit()
    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
