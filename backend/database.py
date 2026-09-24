import sqlite3

DB_NAME = "surplus.db"


def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,

            phone TEXT,
            address TEXT,

            latitude REAL,
            longitude REAL,

            organization_name TEXT,
            food_capacity REAL DEFAULT 0,
            food_preference TEXT,
            people_served INTEGER DEFAULT 0,

            vehicle_type TEXT,
            vehicle_number TEXT,
            available INTEGER DEFAULT 1,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS donations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            donor_id INTEGER NOT NULL,

            food_name TEXT NOT NULL,
            category TEXT,
            quantity REAL NOT NULL,

            location TEXT NOT NULL,
            latitude REAL,
            longitude REAL,

            preparation_time TEXT,
            expiry_time TEXT NOT NULL,

            status TEXT DEFAULT 'Posted',

            matched_ngo_id INTEGER,
            driver_id INTEGER,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(donor_id) REFERENCES users(id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            donation_id INTEGER NOT NULL,
            ngo_id INTEGER,
            driver_id INTEGER,

            distance_km REAL,
            match_score REAL,

            status TEXT DEFAULT 'Matched',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(donation_id) REFERENCES donations(id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            match_id INTEGER NOT NULL,

            pickup_status TEXT DEFAULT 'Pending',
            delivery_status TEXT DEFAULT 'Pending',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(match_id) REFERENCES matches(id)
        )
    """)

    conn.commit()
    conn.close()