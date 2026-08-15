import sqlite3

def init_db():
    """Create the SQLite DB and the device_checkins table if they don't exist."""
    conn = sqlite3.connect("checkins.db")
    cursor = conn.cursor()
    # Use the schema defined in get_schema_sql()
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
    conn = sqlite3.connect("checkins.db")
    cursor = conn.cursor()
    # Use UPSERT to handle first‑time devices
    cursor.execute(
        "INSERT INTO device_checkins (device_id, count) VALUES (?, 1) "
        "ON CONFLICT(device_id) DO UPDATE SET count = count + 1",
        (device_id,)
    )
    conn.commit()
    conn.close()

def get_count(device_id: str) -> int:
    """Return the current check‑in count for the given device ID (0 if none)."""
    conn = sqlite3.connect("checkins.db")
    cursor = conn.cursor()
    cursor.execute("SELECT count FROM device_checkins WHERE device_id = ?", (device_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else 0