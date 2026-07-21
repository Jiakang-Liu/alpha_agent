from uuid import UUID

from backend.infrastructure.db import get_connection


class AnalysisRunRepository:
    async def create_run(
        self,
        run_id: UUID,
        ticker: str,
        user_query: str,
    ) -> None:
        sql = """
            INSERT INTO analysis_runs (
                run_id,
                ticker,
                user_query,
                status,
                current_node
            )
            VALUES (
                %s,
                %s,
                %s,
                'RUNNING',
                NULL
            );
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    sql,
                    (
                        run_id,
                        ticker,
                        user_query,
                    ),
                )
            await conn.commit()

    async def update_current_node(
        self,
        run_id: UUID,
        current_node: str,
    ) -> None:
        sql = """
            UPDATE analysis_runs
            SET
                current_node = %s,
                updated_at = NOW()
            WHERE run_id = %s;
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    sql,
                    (
                        current_node,
                        run_id,
                    ),
                )
            await conn.commit()

    async def mark_success(
        self,
        run_id: UUID,
        final_report: str,
        duration_ms: int,
    ) -> None:
        sql = """
            UPDATE analysis_runs
            SET
                status = 'SUCCESS',
                final_report = %s,
                error_message = NULL,
                finished_at = NOW(),
                duration_ms = %s,
                updated_at = NOW()
            WHERE run_id = %s;
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    sql,
                    (
                        final_report,
                        duration_ms,
                        run_id,
                    ),
                )
            await conn.commit()

    async def mark_failed(
        self,
        run_id: UUID,
        error_message: str,
        duration_ms: int,
    ) -> None:
        sql = """
            UPDATE analysis_runs
            SET
                status = 'FAILED',
                error_message = %s,
                finished_at = NOW(),
                duration_ms = %s,
                updated_at = NOW()
            WHERE run_id = %s;
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    sql,
                    (
                        error_message,
                        duration_ms,
                        run_id,
                    ),
                )
            await conn.commit()
    async def list_runs(
        self,
        limit: int = 20,
    ) -> list[dict]:
        sql = """
            SELECT
                run_id,
                ticker,
                user_query,
                status,
                current_node,
                final_report,
                error_message,
                started_at,
                finished_at,
                duration_ms,
                created_at,
                updated_at
            FROM analysis_runs
            ORDER BY created_at DESC
            LIMIT %s
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, (limit,))
                rows = await cur.fetchall()

        return [
            {
                "run_id": str(row[0]),
                "ticker": row[1],
                "user_query": row[2],
                "status": row[3],
                "current_node": row[4],
                "final_report": row[5],
                "error_message": row[6],
                "started_at": (
                    row[7].isoformat()
                    if row[7]
                    else None
                ),
                "finished_at": (
                    row[8].isoformat()
                    if row[8]
                    else None
                ),
                "duration_ms": row[9],
                "created_at": (
                    row[10].isoformat()
                    if row[10]
                    else None
                ),
                "updated_at": (
                    row[11].isoformat()
                    if row[11]
                    else None
                ),
            }
            for row in rows
        ]