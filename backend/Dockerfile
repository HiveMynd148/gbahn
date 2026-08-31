FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies (postgresql-client provides pg_isready for the entrypoint health check)
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev postgresql-client && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project
COPY . .

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 8000

# Entrypoint: waits for Postgres, runs migrations, seeds DB if empty, then starts uvicorn
ENTRYPOINT ["/app/entrypoint.sh"]
