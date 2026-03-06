FROM python:3.12-alpine
WORKDIR /usr/src/app
COPY . .
CMD ["python3", "main.py"]
