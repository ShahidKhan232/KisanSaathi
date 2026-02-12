# 🐳 Docker Setup Guide for KisanSaathi

This guide provides comprehensive instructions for running KisanSaathi using Docker and Docker Compose.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Service Management](#service-management)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
  - Download: https://www.docker.com/products/docker-desktop
  - Minimum version: Docker 20.10+, Docker Compose 2.0+
- **Git** (to clone the repository)

Verify installation:
```powershell
docker --version
docker-compose --version
```

---

## Quick Start

### 1. Clone the Repository

```powershell
git clone https://github.com/ShahidKhan232/KisanSaathi.git
cd KisanSaathi
```

### 2. Configure Environment Variables

#### Backend Configuration

Copy the Docker environment template:
```powershell
Copy-Item server\.env.docker.example server\.env
```

Edit `server/.env` and update the following **required** variables:
```env
# REQUIRED: Generate a secure JWT secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# REQUIRED: Add your Gemini API key
GEMINI_API_KEY=your-gemini-api-key-here
```

> **💡 Tip**: Generate a secure JWT secret with:
> ```powershell
> # PowerShell
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
> ```

#### Frontend Configuration (Optional)

The frontend uses default values that work with Docker. If needed:
```powershell
Copy-Item frontend\.env.docker.example frontend\.env
```

### 3. Start All Services

```powershell
# Start MongoDB, Backend, and Frontend
docker-compose up -d

# To include the ML service as well:
docker-compose --profile ml up -d
```

### 4. Verify Services are Running

```powershell
# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **API Health Check**: http://localhost:5001/api/health
- **ML Service** (if started): http://localhost:8501

---

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb://mongodb:27017/kisan_saathi` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens | - |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | - |
| `AI_PROVIDER` | No | AI provider (`gemini` or `openai`) | `gemini` |
| `PORT` | No | Backend server port | `5001` |
| `CLIENT_ORIGIN` | No | Allowed CORS origins | `http://localhost:80,http://localhost:5173` |

### Frontend Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_SERVER_URL` | No | Backend API URL | `http://localhost:5001` |

---

## Service Management

### Starting Services

```powershell
# Start all services (MongoDB, Backend, Frontend)
docker-compose up -d

# Start with ML service
docker-compose --profile ml up -d

# Start specific service
docker-compose up -d backend
```

### Stopping Services

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Viewing Logs

```powershell
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuilding Services

After making code changes:

```powershell
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Accessing Container Shell

```powershell
# Access backend container
docker exec -it kisansaathi-backend sh

# Access MongoDB shell
docker exec -it kisansaathi-mongodb mongosh kisan_saathi
```

---

## Troubleshooting

### Issue: Containers won't start

**Solution**: Check logs for errors
```powershell
docker-compose logs backend
docker-compose logs mongodb
```

### Issue: Backend can't connect to MongoDB

**Symptoms**: Backend logs show "Failed to connect to database"

**Solution**:
1. Ensure MongoDB is healthy:
   ```powershell
   docker-compose ps
   ```
2. Check MongoDB logs:
   ```powershell
   docker-compose logs mongodb
   ```
3. Verify `MONGO_URI` in `server/.env` uses `mongodb://mongodb:27017/kisan_saathi`

### Issue: Frontend can't reach Backend API

**Symptoms**: Network errors in browser console

**Solution**:
1. Verify backend is running:
   ```powershell
   curl http://localhost:5001/api/health
   ```
2. Check `VITE_SERVER_URL` in frontend environment
3. Ensure CORS is configured correctly in `server/.env`

### Issue: Port already in use

**Symptoms**: Error like "port is already allocated"

**Solution**:
1. Find and stop the conflicting process:
   ```powershell
   # Find process using port 5001
   netstat -ano | findstr :5001
   
   # Stop the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```
2. Or change the port in `docker-compose.yml`

### Issue: Changes not reflected after rebuild

**Solution**:
```powershell
# Clear Docker cache and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Database data lost after restart

**Solution**: Ensure you're not using `docker-compose down -v` which removes volumes. Use `docker-compose down` instead.

---

## Production Deployment

### Recommended Changes for Production

1. **Use Environment-Specific Compose File**
   ```powershell
   # Create docker-compose.prod.yml
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Update Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Update `CLIENT_ORIGIN` to your production domain
   - Use MongoDB Atlas or managed MongoDB service

3. **Enable HTTPS**
   - Add nginx reverse proxy with SSL certificates
   - Use Let's Encrypt for free SSL certificates

4. **Resource Limits**
   Add to `docker-compose.yml`:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 1G
   ```

5. **Health Monitoring**
   - Set up monitoring with tools like Prometheus/Grafana
   - Configure log aggregation (ELK stack, CloudWatch, etc.)

6. **Backup Strategy**
   - Regular MongoDB backups
   - Volume snapshots
   - Automated backup scripts

### Example Production docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    environment:
      - NODE_ENV=production
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  frontend:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  mongodb:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
```

---

## Additional Commands

### Clean Up Everything

```powershell
# Stop all containers
docker-compose down

# Remove all images
docker-compose down --rmi all

# Remove all volumes (WARNING: deletes all data)
docker-compose down -v --rmi all

# Prune unused Docker resources
docker system prune -a --volumes
```

### Database Management

```powershell
# Backup MongoDB data
docker exec kisansaathi-mongodb mongodump --out /data/backup

# Restore MongoDB data
docker exec kisansaathi-mongodb mongorestore /data/backup

# Export to host machine
docker cp kisansaathi-mongodb:/data/backup ./mongodb-backup
```

---

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/ShahidKhan232/KisanSaathi/issues
- **Documentation**: See main [README.md](./README.md)

---

**Made with ❤️ for Indian Farmers**
