FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y netcat-traditional
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["daphne", "-b", "0.0.0.0", "-p", "8004", "notification_service.asgi:application"]