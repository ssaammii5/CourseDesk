# eClassroomPro — Backend

FastAPI + PostgreSQL + SQLAlchemy 2.0 (module style: models / dtos / controller / router).

## Run

```bash
cd backend
docker compose up -d          # PostgreSQL on :5432
uv sync                       # or: pip install -e .
python -m app.utils.seed      # creates tables + demo data
uvicorn app.main:app --port 5000 --reload