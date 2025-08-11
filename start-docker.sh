#!/bin/bash

echo "🐳 Starting AMNEX Food Management System with Docker..."

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down

# Build the application
echo "Building application..."
docker-compose build

# Start the services
echo "Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Show logs
echo "Services started! Showing logs..."
docker-compose logs -f
