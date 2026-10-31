FROM python:3.14-slim
WORKDIR /app
COPY services/api/requirements.lock.txt services/api/requirements.lock.txt
RUN pip install --no-cache-dir -r services/api/requirements.lock.txt
COPY services/api services/api
COPY data data
ENV PYTHONPATH=services/api DEMO_DB_PATH=/data/resumeloop.sqlite3 RL_AUTH=required OLLAMA_URL=http://host.docker.internal:11434
RUN useradd --system --uid 10001 app && mkdir -p /data && chown app /data
USER app
VOLUME /data
EXPOSE 8014
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8014"]
