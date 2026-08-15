import re


def test_new_device_starts_at_zero_checkins(client, device_headers):
    resp = client.get("/api/checkins", headers=device_headers)
    assert resp.status_code == 200
    assert resp.json()["count"] == 0


def test_completing_an_analysis_increments_the_count(client, mock_model_ok, device_headers):
    client.post("/api/analyze", json={"text": "an ordinary entry"}, headers=device_headers)
    resp = client.get("/api/checkins", headers=device_headers)
    assert resp.json()["count"] == 1


def test_count_persists_and_accumulates_across_requests(client, mock_model_ok, device_headers):
    for _ in range(3):
        client.post("/api/analyze", json={"text": "another entry"}, headers=device_headers)
    resp = client.get("/api/checkins", headers=device_headers)
    assert resp.json()["count"] == 3


def test_crisis_path_still_counts_as_a_checkin(client, device_headers):
    # A person reaching out during a hard moment should still be counted --
    # the count reflects engagement with the tool, not "successful" entries.
    client.post("/api/analyze", json={"text": "I want to end it all"}, headers=device_headers)
    resp = client.get("/api/checkins", headers=device_headers)
    assert resp.json()["count"] == 1


def test_different_devices_have_independent_counts(client, mock_model_ok):
    client.post(
        "/api/analyze",
        json={"text": "entry from device A"},
        headers={"X-Device-Id": "device-a"},
    )
    resp_a = client.get("/api/checkins", headers={"X-Device-Id": "device-a"})
    resp_b = client.get("/api/checkins", headers={"X-Device-Id": "device-b"})
    assert resp_a.json()["count"] == 1
    assert resp_b.json()["count"] == 0


def test_checkin_record_stores_no_journal_text():
    # Guardrail: the checkin store must only ever hold a count + device id,
    # never the text of what someone wrote. Inspect the schema directly.
    # Note: "text" as a SQL column TYPE (e.g. `device_id TEXT`) is fine --
    # this checks for column NAMES that would suggest journal content.
    from app import checkins
    import re

    schema = checkins.get_schema_sql().lower()
    forbidden_columns = ["content", "entry", "journal", "message", "body"]
    for word in forbidden_columns:
        assert word not in schema, f"schema should not have a '{word}' column"
    # catch a column literally named "text" (not the TEXT type keyword)
    assert not re.search(r"\btext\s+(text|varchar|char)\b", schema), \
        "schema should not have a column named 'text'"


def test_checkin_response_has_no_gamification_language(client, device_headers):
    # Guardrail against streaks/points/badges creeping in under time pressure.
    resp = client.get("/api/checkins", headers=device_headers)
    body_text = str(resp.json()).lower()
    forbidden = ["streak", "badge", "points", "level up", "reward", "score"]
    for word in forbidden:
        assert word not in body_text, f"'{word}' should not appear in the checkin response"
