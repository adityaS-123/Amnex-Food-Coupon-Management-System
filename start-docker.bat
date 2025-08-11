@echo off
echo Starting AMNEX Food Management System with Docker...

echo Stopping existing containers...
docker-compose down

echo Building application...
docker-compose build

echo Starting services...
docker-compose up -d

echo Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo Services started! Access the application at http://localhost:3000
echo To view logs, run: docker-compose logs -f

pause
