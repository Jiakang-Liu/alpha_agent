# backend/tests/test_db.py

import pytest


@pytest.mark.anyio
async def test_open_db_pool(monkeypatch):
    import backend.infrastructure.db as db

    called = False

    async def fake_open():
        nonlocal called
        called = True

    monkeypatch.setattr(
        db.db_pool,
        "open",
        fake_open,
    )

    await db.open_db_pool()

    assert called is True


@pytest.mark.anyio
async def test_close_db_pool(monkeypatch):
    import backend.infrastructure.db as db

    called = False

    async def fake_close():
        nonlocal called
        called = True

    monkeypatch.setattr(
        db.db_pool,
        "close",
        fake_close,
    )

    await db.close_db_pool()

    assert called is True


def test_get_connection(monkeypatch):
    import backend.infrastructure.db as db

    fake_connection = object()

    monkeypatch.setattr(
        db.db_pool,
        "connection",
        lambda: fake_connection,
    )

    conn = db.get_connection()

    assert conn is fake_connection