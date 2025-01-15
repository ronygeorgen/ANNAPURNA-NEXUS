FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Set environment variables to make pip more reliable
ENV PIP_DEFAULT_TIMEOUT=100 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libpq-dev \
    netcat-traditional \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    git \
    # Add these new dependencies for OpenCV
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install setuptools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements first for better cache utilization
COPY requirements.txt .

# Install ML dependencies in correct order
RUN pip install --no-cache-dir numpy==1.26.4 scipy==1.14.1 && \
    pip install --no-cache-dir dlib==19.24.6 && \
    pip install --no-cache-dir git+https://github.com/ageitgey/face_recognition_models && \
    pip install --no-cache-dir face-recognition==1.3.0

# Install remaining requirements with retry mechanism
RUN pip install --no-cache-dir -r requirements.txt || \
    (sleep 5 && pip install --no-cache-dir -r requirements.txt) || \
    (sleep 10 && pip install --no-cache-dir -r requirements.txt)

# Copy project files
COPY . .

# Run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8002"]