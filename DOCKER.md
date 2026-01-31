# Docker Setup for CertIntel

This directory contains Docker configuration files for running the CertIntel AI Certificate Validator application.

## Files

- `Dockerfile` - Multi-stage build configuration for the Node.js application
- `.dockerignore` - Excludes unnecessary files from Docker build context
- `docker-compose.yml` - Complete stack with optional PostgreSQL and Elasticsearch services

## Quick Start

### Option 1: Docker Compose (Recommended)

Run the complete stack with all services:

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d --build

# View logs
docker-compose logs -f certintel-api

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Option 2: Docker Build & Run

Build and run just the application container:

```bash
# Build the image
docker build -t certintel-api .

# Run the container
docker run -p 8800:8800 certintel-api

# Run with environment variables
docker run -p 8800:8800 -e NODE_ENV=production certintel-api
```

## Configuration

### Environment Variables

- `NODE_ENV` - Set to `production` for optimized runtime
- `PORT` - Application port (default: 8800)
- `DB_HOST` - PostgreSQL host (when enabling database)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `ELASTICSEARCH_URL` - Elasticsearch connection URL

### Ports

- `8800` - Main application API
- `5432` - PostgreSQL database (if using docker-compose)
- `9200` - Elasticsearch HTTP API (if using docker-compose)

### Volumes

The application serves static files from `/public` and loads data from `/data` directory. The docker-compose setup includes:

- Data persistence for PostgreSQL
- Data persistence for Elasticsearch
- Read-only mounting of JSON data files

## Health Checks

The application includes health checks at:
- HTTP: `GET /health`
- Docker: Automatic health monitoring with wget

## Security Features

- Non-root user execution
- Multi-stage build for smaller production image
- Minimal Alpine Linux base image
- Proper signal handling with dumb-init
- Read-only file system where possible

## Development

For development with hot-reload, use the npm scripts directly rather than Docker:

```bash
npm install
npm run dev
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the host port mapping in docker-compose.yml
2. **Build fails**: Ensure all source files are present and TypeScript compiles correctly
3. **Database connection**: Verify PostgreSQL is running and credentials are correct
4. **Permission errors**: The application runs as non-root user `certintel` (UID 1001)

### Logs

```bash
# View application logs
docker-compose logs certintel-api

# View all service logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f
```