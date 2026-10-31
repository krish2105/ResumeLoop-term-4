import os
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client(monkeypatch,tmp_path):
    monkeypatch.setenv('DEMO_DB_PATH',str(tmp_path/'test.sqlite3'))
    # main.STATE is resolved at import, override it safely per test
    import app.main as mod
    monkeypatch.setattr(mod,'STATE',tmp_path/'test.sqlite3')
    return TestClient(mod.app)


@pytest.fixture(autouse=True)
def isolated_state(monkeypatch, tmp_path):
    """Every test gets its own database file, so a course imported on this machine never leaks in."""
    import app.main as mod
    monkeypatch.setattr(mod, 'STATE', tmp_path / 'auto.sqlite3')
