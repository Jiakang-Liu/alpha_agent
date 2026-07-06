import os
from dotenv import load_dotenv
from psycopg_pool import AsyncConnectionPool

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "alpha_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "alpha_password_2026")
DB_NAME = os.getenv("DB_DATABASE", "alpha_rag_db")

conninfo = (
    f"dbname={DB_NAME} "
    f"user={DB_USER} "
    f"password={DB_PASSWORD} "
    f"host={DB_HOST} "
    f"port={DB_PORT}"
)

db_pool: AsyncConnectionPool | None = None


def create_db_pool() -> AsyncConnectionPool:
    return AsyncConnectionPool(
        conninfo=conninfo,
        min_size=1,
        max_size=10,
        open=False,
    )


async def open_db_pool():
    global db_pool

    if db_pool is not None and not db_pool.closed:
        print("[DB] pool already open", flush=True)
        return

    db_pool = create_db_pool()
    await db_pool.open()

    print("[DB] pool opened", flush=True)


async def close_db_pool():
    global db_pool

    if db_pool is None:
        print("[DB] pool already None", flush=True)
        return

    if not db_pool.closed:
        await db_pool.close()
        print("[DB] pool closed", flush=True)

    db_pool = None


def get_connection():
    if db_pool is None or db_pool.closed:
        raise RuntimeError("Database pool is not open.")

    return db_pool.connection()