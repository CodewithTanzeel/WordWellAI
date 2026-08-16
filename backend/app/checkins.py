import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "checkins.db")


def _connect():
    directory = os.path.dirname(DB_PATH)
    if directory:
        os.makedirs(directory, exist_ok=True)
    return sqlite3.connect(DB_PATH)


def init_db():
    """Create the SQLite DB and the device_checkins table if they don't exist."""
    conn = _connect()
    cursor = conn.cursor()
    cursor.executescript(get_schema_sql())
    conn.commit()
    conn.close()


def get_schema_sql() -> str:
    return """
    CREATE TABLE IF NOT EXISTS device_checkins (
        device_id TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0
    )
    """


def increment(device_id: str):
    """Increment the check‑in count for the given device ID.
    If the device does not yet exist, it is inserted with count = 1.
    """
    conn = _connect()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO device_checkins (device_id, count) VALUES (?, 1) "
        "ON CONFLICT(device_id) DO UPDATE SET count = count + 1",
        (device_id,)
    )
    conn.commit()
    conn.close()


def get_count(device_id: str) -> int:
    """Return the current check‑in count for the given device ID (0 if none)."""
    conn = _connect()
    cursor = conn.cursor()
    cursor.execute("SELECT count FROM device_checkins WHERE device_id = ?", (device_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else 0