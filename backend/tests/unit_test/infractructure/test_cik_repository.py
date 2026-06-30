# backend/tests/test_cik_repository.py

import pytest


class FakeCursor:
    def __init__(self, fetchone_result=None):
        self.executed = []
        self.fetchone_result = fetchone_result

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass

    async def execute(self, sql, params=None):
        self.executed.append((sql, params))

    async def fetchone(self):
        return self.fetchone_result


class FakeConnection:
    def __init__(self, cursor):
        self.cursor_obj = cursor
        self.committed = False

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass

    def cursor(self):
        return self.cursor_obj

    async def commit(self):
        self.committed = True


@pytest.mark.anyio
async def test_fetch_sec_ticker_mapping(monkeypatch):
    import backend.infrastructure.cik_repository as cik_repo

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "0": {
                    "cik_str": 320193,
                    "ticker": "aapl",
                    "title": "Apple Inc.",
                }
            }

    class FakeAsyncClient:
        def __init__(self, timeout):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            pass

        async def get(self, url, headers):
            return FakeResponse()

    monkeypatch.setattr(cik_repo.httpx, "AsyncClient", FakeAsyncClient)

    repo = cik_repo.CIKRepository()
    records = await repo.fetch_sec_ticker_mapping()

    assert records == [
        {
            "ticker": "AAPL",
            "cik": "0000320193",
            "company_name": "Apple Inc.",
        }
    ]


@pytest.mark.anyio
async def test_ensure_table_exists(monkeypatch):
    import backend.infrastructure.cik_repository as cik_repo

    cursor = FakeCursor()
    conn = FakeConnection(cursor)

    monkeypatch.setattr(cik_repo, "get_connection", lambda: conn)

    repo = cik_repo.CIKRepository()
    await repo.ensure_table_exists()

    assert len(cursor.executed) == 1
    assert "CREATE TABLE IF NOT EXISTS ticker_cik_mapping" in cursor.executed[0][0]
    assert conn.committed is True


@pytest.mark.anyio
async def test_refresh_mapping(monkeypatch):
    import backend.infrastructure.cik_repository as cik_repo

    cursor = FakeCursor()
    conn = FakeConnection(cursor)

    async def fake_fetch_sec_ticker_mapping(self):
        return [
            {
                "ticker": "AAPL",
                "cik": "0000320193",
                "company_name": "Apple Inc.",
            },
            {
                "ticker": "MSFT",
                "cik": "0000789019",
                "company_name": "Microsoft Corp.",
            },
        ]

    monkeypatch.setattr(cik_repo, "get_connection", lambda: conn)
    monkeypatch.setattr(
        cik_repo.CIKRepository,
        "fetch_sec_ticker_mapping",
        fake_fetch_sec_ticker_mapping,
    )

    repo = cik_repo.CIKRepository()
    count = await repo.refresh_mapping()

    assert count == 2
    assert len(cursor.executed) == 2
    assert "ON CONFLICT (ticker)" in cursor.executed[0][0]
    assert cursor.executed[0][1] == (
        "AAPL",
        "0000320193",
        "Apple Inc.",
    )
    assert conn.committed is True


@pytest.mark.anyio
async def test_get_cik_by_ticker_found(monkeypatch):
    import backend.infrastructure.cik_repository as cik_repo

    cursor = FakeCursor(fetchone_result=("0000320193",))
    conn = FakeConnection(cursor)

    monkeypatch.setattr(cik_repo, "get_connection", lambda: conn)

    repo = cik_repo.CIKRepository()
    cik = await repo.get_cik_by_ticker("aapl")

    assert cik == "0000320193"
    assert cursor.executed[0][1] == ("AAPL",)


@pytest.mark.anyio
async def test_get_cik_by_ticker_not_found(monkeypatch):
    import backend.infrastructure.cik_repository as cik_repo

    cursor = FakeCursor(fetchone_result=None)
    conn = FakeConnection(cursor)

    monkeypatch.setattr(cik_repo, "get_connection", lambda: conn)

    repo = cik_repo.CIKRepository()
    cik = await repo.get_cik_by_ticker("unknown")

    assert cik is None