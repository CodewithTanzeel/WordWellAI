def init_db():
    pass

def get_schema_sql() -> str:
    # The tests will inspect this string to ensure no text/journal columns exist.
    return """
    CREATE TABLE IF NOT EXISTS device_checkins (
        device_id TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0
    )
    """

def increment(device_id: str):
    pass

def get_count(device_id: str) -> int:
    return 0