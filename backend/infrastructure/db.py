import os
from psycopg_pool import AsyncConnectionPool
from dotenv import load_dotenv

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

db_pool = AsyncConnectionPool(
    conninfo=conninfo,
    min_size=1,
    max_size=10,
    open=False,
)


async def open_db_pool():
    await db_pool.open()


async def close_db_pool():
    await db_pool.close()


def get_connection():
    return db_pool.connection()