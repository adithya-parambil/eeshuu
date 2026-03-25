# 🚀 AWS EC2 Deployment Guide

Complete guide for deploying Quick Commerce to AWS EC2 with a single command.

## 📋 Prerequisites

- AWS Account
- EC2 instance (Ubuntu 22.04 or 24.04)
- Security Group configured (ports 22, 80, 443)
- SSH access to your instance

## 🎯 Recommended EC2 Configuration

### For Production Launch (50-100 concurrent users)
- **Instance Type**: `m7i-flex.large`
- **vCPU**: 2
- **Memory**: 8 GiB
- **Storage**: 25 GiB (gp3)
- **Cost**: ~$73/month (~$0.10/hour)

### For Higher Traffic (100-500 concurrent users)
- **Instance Type**: `m7i-flex.xlarge`
- **vCPU**: 4
- **Memory**: 16 GiB
- **Storage**: 50 GiB (gp3)
- **Cost**: ~$146/month (~$0.20/hour)

## ⚡ Single-Command Deployment

### Option 1: After Cloning Repository

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Run setup script
bash setup-ec2.sh
```

### Option 2: Direct Download & Run

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-ec2.sh | bash
```

### Option 3: If Already Cloned (Quick Deploy)

```bash
# If you already have the repo cloned
cd YOUR_REPO
bash deploy.sh
```

## 🔧 What the Script Does

The `setup-ec2.sh` script automatically:

1. ✅ Updates system packages
2. ✅ Installs Docker & Docker Compose
3. ✅ Installs Git (if needed)
4. ✅ Detects your public IP
5. ✅ Clones your repository (if not already cloned)
6. ✅ Generates secure secrets (JWT, MongoDB password)
7. ✅ Creates `.env` file with all configurations
8. ✅ Builds and starts all services:
   - MongoDB (with persistent storage)
   - Redis (Socket.io adapter for scaling)
   - Backend (Express + Socket.io)
   - Frontend (Next.js)
   - Nginx (reverse proxy)
9. ✅ Waits for all services to be healthy
10. ✅ Seeds demo data
11. ✅ Configures firewall (UFW)
12. ✅ Enables auto-restart on reboot

## 🎬 Expected Output

```
━━━ Quick Commerce EC2 Setup ━━━

▶ Updating system packages...
✓ System updated
✓ Docker installed: Docker version 24.0.7
✓ Docker Compose installed
✓ Git already installed
✓ Public IP: 54.123.45.67

━━━ Repository Setup ━━━
✓ Repository cloned

━━━ Generating Secrets ━━━
✓ Secrets generated

▶ Creating .env file...
✓ .env created

━━━ Building and Starting Services ━━━
▶ This will take 3-5 minutes on first run...
✓ Services started

━━━ Health Checks ━━━
✓ MongoDB is healthy
✓ Redis is healthy
✓ Backend is healthy

━━━ Seeding Demo Data ━━━
✓ Demo data seeded

═══════════════════════════════════════════════════════════════
                    🚀 DEPLOYMENT COMPLETE! 🚀
═══════════════════════════════════════════════════════════════

  Application URL:  http://54.123.45.67
  API Health:       http://54.123.45.67/health/live
  API Endpoint:     http://54.123.45.67/api/v1/products

Demo Credentials:
  Customer:  customer@demo.com  / Demo@1234
  Delivery:  delivery@demo.com  / Demo@1234
  Admin:     admin@demo.com     / Demo@1234
```

## 🔐 Security Group Configuration

Ensure your EC2 Security Group allows:

| Type  | Protocol | Port Range | Source    | Description          |
|-------|----------|------------|-----------|----------------------|
| SSH   | TCP      | 22         | Your IP   | SSH access           |
| HTTP  | TCP      | 80         | 0.0.0.0/0 | Web traffic          |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | Secure web traffic   |

## 📊 Services Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Port 80)                      │
│              Reverse Proxy & Load Balancer              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│   Frontend     │      │    Backend      │
│   (Next.js)    │      │  (Express +     │
│   Port 3000    │      │   Socket.io)    │
└────────────────┘      │   Port 5000     │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
            ┌───────▼──────┐ ┌──▼──────┐ ┌──▼──────┐
            │   MongoDB    │ │  Redis  │ │ Socket  │
            │   Port 27017 │ │ Port    │ │ Adapter │
            │              │ │ 6379    │ │         │
            └──────────────┘ └─────────┘ └─────────┘
```

## 🛠️ Useful Commands

### View Service Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
docker compose logs -f redis
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### Stop Services
```bash
# Stop (keep data)
docker compose down

# Stop and wipe all data
docker compose down -v
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up --build -d
```

## 🔄 Redis Socket.io Adapter

Redis is now **enabled by default** for horizontal scaling:

- Allows multiple backend instances to share Socket.io connections
- Enables load balancing across multiple servers
- Provides session persistence across restarts
- Memory limit: 256MB with LRU eviction policy

### Verify Redis is Working
```bash
# Check Redis connection
docker compose exec redis redis-cli ping
# Should return: PONG

# Check Redis keys
docker compose exec redis redis-cli keys "qc:*"
```

## 📈 Monitoring & Health Checks

### Health Endpoints
- **Backend**: `http://your-ip/health/live`
- **API**: `http://your-ip/api/v1/products`

### Resource Monitoring
```bash
# Container resource usage
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

## 🔧 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs backend

# Restart services
docker compose restart
```

### Out of Memory
```bash
# Check memory usage
free -h

# Restart services to free memory
docker compose restart
```

### Port Already in Use
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop conflicting service
sudo systemctl stop apache2  # or nginx
```

### Can't Access Application
1. Check Security Group allows port 80
2. Check services are running: `docker compose ps`
3. Check backend health: `curl http://localhost/health/live`
4. Check logs: `docker compose logs -f`

## 💰 AWS Free Tier Information

### m7i-flex.large Free Tier Status
**❌ NOT included in AWS Free Tier**

The m7i-flex.large instance is NOT part of the AWS Free Tier. 

### AWS Free Tier Eligible Instances
The AWS Free Tier includes:
- **t2.micro** or **t3.micro** (depending on region)
- **750 hours/month** for 12 months
- **1 vCPU, 1 GiB RAM**

⚠️ **Warning**: t2.micro/t3.micro is **NOT sufficient** for this application stack (Next.js + Express + MongoDB + Redis + Nginx).

### Cost Breakdown for m7i-flex.large
- **Hourly**: $0.10075 (Linux)
- **Daily**: ~$2.42
- **Monthly**: ~$73
- **Yearly**: ~$876

### Free Tier Duration
- **12 months** from account creation
- Only applies to t2.micro/t3.micro instances
- After 12 months, standard rates apply

### Recommendation
For testing/learning:
1. Use **t3.medium** (2 vCPU, 4 GiB) - ~$30/month
2. Monitor usage and upgrade to m7i-flex.large for production

For production:
1. Start with **m7i-flex.large** (recommended)
2. Scale to **m7i-flex.xlarge** when traffic grows

## 🎯 Next Steps

1. **Configure Domain** (optional):
   - Point your domain to EC2 IP
   - Update `.env` with your domain
   - Setup SSL with Let's Encrypt

2. **Setup SSL/HTTPS**:
   ```bash
   # Install Certbot
   sudo apt-get install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Configure Payment Gateway**:
   - Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env`
   - Add Razorpay secret key

4. **Setup Monitoring**:
   - Enable CloudWatch metrics
   - Setup alerts for CPU/Memory usage
   - Configure log aggregation

5. **Backup Strategy**:
   - Setup automated EBS snapshots
   - Configure MongoDB backups
   - Store backups in S3

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)

## 🆘 Support

If you encounter issues:
1. Check logs: `docker compose logs -f`
2. Verify all services are running: `docker compose ps`
3. Check health endpoint: `curl http://localhost/health/live`
4. Review Security Group settings
5. Ensure sufficient disk space: `df -h`

---

**Happy Deploying! 🚀**
