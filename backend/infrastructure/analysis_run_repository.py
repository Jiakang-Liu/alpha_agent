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