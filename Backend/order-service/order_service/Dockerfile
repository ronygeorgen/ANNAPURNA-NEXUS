FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    netcat-traditional \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Celery and Redis
RUN pip install --no-cache-dir "celery>=5.3.6" "redis>=5.0.1"

# Copy project files
COPY . .

# Create directory for celery beat scheduler
RUN mkdir -p /app/celerybeat

# Run the server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8003"]