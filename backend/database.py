import httpx
from config import settings


def _turso_url():
    return settings.turso_url.replace("libsql://", "https://")


def _headers():
    return {"Authorization": f"Bearer {settings.turso_token}"}


async def _execute(sql: str, args: list = []):
    url = f"{_turso_url()}/v2/pipeline"
    payload = {
        "requests": [
            {"type": "execute", "stmt": {"sql": sql, "args": [{"type": "text", "value": str(a)} if a is not None else {"type": "null"} for a in args]}},
            {"type": "close"}
        ]
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=payload, headers=_headers())
        r.raise_for_status()
        return r.json()["results"][0]


async def init_db():
    await _execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT UNIQUE NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            password    TEXT NOT NULL,
            created_at  TEXT NOT NULL,
            full_name   TEXT
        )
    """)


def _parse_row(result, row):
    cols = [c["name"] for c in result["response"]["result"]["cols"]]
    return dict(zip(cols, [v.get("value") for v in row]))


async def get_user_by_username(username: str):
    result = await _execute("SELECT * FROM users WHERE username = ?", [username])
    rows = result["response"]["result"]["rows"]
    return _parse_row(result, rows[0]) if rows else None


async def get_user_by_email(email: str):
    result = await _execute("SELECT * FROM users WHERE email = ?", [email])
    rows = result["response"]["result"]["rows"]
    return _parse_row(result, rows[0]) if rows else None


async def get_user_by_id(user_id: int):
    result = await _execute("SELECT * FROM users WHERE id = ?", [user_id])
    rows = result["response"]["result"]["rows"]
    return _parse_row(result, rows[0]) if rows else None


async def create_user(username: str, email: str, hashed_password: str, full_name: str = None) -> int:
    from datetime import datetime, timezone
    created_at = datetime.now(timezone.utc).isoformat()
    result = await _execute(
        "INSERT INTO users (username, email, password, created_at, full_name) VALUES (?, ?, ?, ?, ?)",
        [username, email, hashed_password, created_at, full_name],
    )
    return result["response"]["result"]["last_insert_rowid"]
