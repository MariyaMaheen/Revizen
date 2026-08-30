import libsql_client
from config import settings


def _get_client():
    turso_url = getattr(settings, 'turso_url', None)
    turso_token = getattr(settings, 'turso_token', None)
    if turso_url and turso_token:
        return libsql_client.create_client(
            url=turso_url,
            auth_token=turso_token,
        )
    return libsql_client.create_client(url=f"file:{settings.db_path}")


async def init_db():
    async with _get_client() as client:
        await client.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT UNIQUE NOT NULL,
                email       TEXT UNIQUE NOT NULL,
                password    TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                full_name   TEXT
            )
        """)


async def get_user_by_username(username: str):
    async with _get_client() as client:
        result = await client.execute(
            "SELECT * FROM users WHERE username = ?", [username]
        )
        if result.rows:
            return dict(zip([c.name for c in result.columns], result.rows[0]))
        return None


async def get_user_by_email(email: str):
    async with _get_client() as client:
        result = await client.execute(
            "SELECT * FROM users WHERE email = ?", [email]
        )
        if result.rows:
            return dict(zip([c.name for c in result.columns], result.rows[0]))
        return None


async def get_user_by_id(user_id: int):
    async with _get_client() as client:
        result = await client.execute(
            "SELECT * FROM users WHERE id = ?", [user_id]
        )
        if result.rows:
            return dict(zip([c.name for c in result.columns], result.rows[0]))
        return None


async def create_user(username: str, email: str, hashed_password: str, full_name: str = None) -> int:
    from datetime import datetime, timezone
    created_at = datetime.now(timezone.utc).isoformat()
    async with _get_client() as client:
        result = await client.execute(
            "INSERT INTO users (username, email, password, created_at, full_name) VALUES (?, ?, ?, ?, ?)",
            [username, email, hashed_password, created_at, full_name],
        )
        return result.last_insert_rowid
