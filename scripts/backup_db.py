"""Back up or restore the local ResumeLoop database.

    PYTHONPATH=services/api .venv/bin/python scripts/backup_db.py backup            # -> backups/resumeloop-<time>.sqlite3
    PYTHONPATH=services/api .venv/bin/python scripts/backup_db.py restore <file>    # stop the API first

Uses DEMO_DB_PATH when set. Backups stay outside Git (backups/ is ignored).
"""
import sys
from pathlib import Path

from app.main import STATE
from app.ops import backup, restore

ROOT = Path(__file__).resolve().parents[1]

if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'backup':
        print(backup(STATE, ROOT / 'backups'))
    elif len(sys.argv) == 3 and sys.argv[1] == 'restore':
        kept = restore(Path(sys.argv[2]), STATE)
        print(f'restored {sys.argv[2]} -> {STATE}' + (f' (previous copy kept at {kept})' if kept else ''))
    else:
        raise SystemExit(__doc__)
