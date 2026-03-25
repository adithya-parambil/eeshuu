# ✅ Pre-Deployment Checklist

Complete this checklist before deploying to AWS EC2.

## 🔧 AWS Setup

### EC2 Instance
- [ ] EC2 instance created (Ubuntu 22.04 or 24.04)
- [ ] Instance type: m7i-flex.large (or better)
- [ ] Storage: 25 GiB minimum
- [ ] Instance is running

### Security Group
- [ ] Port 22 (SSH) - Your IP only
- [ ] Port 80 (HTTP) - 0.0.0.0/0
- [ ] Port 443 (HTTPS) - 0.0.0.0/0

### SSH Access
- [ ] SSH key pair downloaded (.pem file)
- [ ] Key permissions set: `chmod 400 your-key.pem`
- [ ] Can SSH into instance: `ssh -i your-key.pem ubuntu@your-ip`

## 📦 Repository Setup

### Git Repository
- [ ] Code pushed to GitHub/GitLab
- [ ] Repository is accessible (public or SSH key configured)
- [ ] All deployment files committed:
  - [ ] `setup-ec2.sh`
  - [ ] `deploy.sh`
  - [ ] `docker-compose.yml`
  - [ ] `.env.example`
  - [ ] `Dockerfile`
  - [ ] `backend/Dockerfile`
  - [ ] `nginx/nginx.conf`

### Environment Variables
- [ ] `.env.example` is up to date
- [ ] All required variables documented
- [ ] Secrets will be auto-generated (JWT, MongoDB password)

## 🔐 Third-Party Services (Optional)

### Payment Gateway (Razorpay)
- [ ] Razorpay account created (if using payments)
- [ ] Test API keys obtained
- [ ] Production keys ready for later

### Geocoding API (Optional)
- [ ] OpenCage API key obtained (2,500 free/day)
- [ ] OR Google Maps API key obtained

### Domain & SSL (Optional)
- [ ] Domain purchased (if using custom domain)
- [ ] DNS configured to point to EC2 IP
- [ ] Ready to setup SSL with Let's Encrypt

## 💰 Cost Awareness

### AWS Billing
- [ ] Understand m7i-flex.large is NOT free tier
- [ ] Cost: ~$73/month (~$0.10/hour)
- [ ] Billing alerts configured in AWS
- [ ] Budget set in AWS Cost Explorer

### Cost Optimization
- [ ] Considered t3.medium for testing (~$30/month)
- [ ] Plan to use Reserved Instances for production (save 40%)
- [ ] Understand spot instances for dev/test (save 90%)

## 📋 Pre-Deployment Commands

### 1. Test SSH Connection
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Update System (Optional - script does this)
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 3. Check Disk Space
```bash
df -h
# Should have at least 20GB free
```

### 4. Check Memory
```bash
free -h
# Should show 8GB for m7i-flex.large
```

## 🚀 Deployment Steps

### Option 1: Complete Setup (First Time)
```bash
# 1. SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Clone repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 3. Run setup script
bash setup-ec2.sh
```

### Option 2: Quick Deploy (Repo Already Cloned)
```bash
cd YOUR_REPO
bash deploy.sh
```

## ✅ Post-Deployment Verification

### 1. Check Services
```bash
docker compose ps
# All services should be "Up" and "healthy"
```

### 2. Check Health Endpoint
```bash
curl http://localhost/health/live
# Should return: {"status":"ok"}
```

### 3. Check API
```bash
curl http://localhost/api/v1/products
# Should return JSON array of products
```

### 4. Check Redis
```bash
docker compose exec redis redis-cli ping
# Should return: PONG
```

### 5. Check MongoDB
```bash
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
# Should return: { ok: 1 }
```

### 6. Access Application
- Open browser: `http://YOUR_EC2_IP`
- Should see login page
- Try demo credentials

### 7. Test Demo Login
```
Customer:  customer@demo.com  / Demo@1234
Delivery:  delivery@demo.com  / Demo@1234
Admin:     admin@demo.com     / Demo@1234
```

## 🔍 Monitoring Setup

### AWS CloudWatch
- [ ] Enable detailed monitoring
- [ ] Setup CPU alarm (>80%)
- [ ] Setup memory alarm (>80%)
- [ ] Setup disk alarm (>80%)

### Application Logs
```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f backend
```

### Resource Monitoring
```bash
# Container stats
docker stats

# System resources
htop  # or top
```

## 🛡️ Security Hardening (Post-Deployment)

### Immediate
- [ ] Change default SSH port (optional)
- [ ] Disable root login
- [ ] Setup fail2ban
- [ ] Enable automatic security updates

### Within 24 Hours
- [ ] Setup SSL/HTTPS with Let's Encrypt
- [ ] Configure domain (if using)
- [ ] Update CORS settings with actual domain
- [ ] Change demo user passwords

### Within 1 Week
- [ ] Setup automated backups
- [ ] Configure log rotation
- [ ] Setup monitoring alerts
- [ ] Document runbook

## 📊 Performance Baseline

After deployment, record baseline metrics:

### Response Times
- [ ] Homepage load time: _____ ms
- [ ] API response time: _____ ms
- [ ] Socket.io connection time: _____ ms

### Resource Usage
- [ ] CPU idle: _____ %
- [ ] Memory used: _____ MB / 8192 MB
- [ ] Disk used: _____ GB / 25 GB

### Concurrent Users
- [ ] Test with 10 users: [ ] Pass / [ ] Fail
- [ ] Test with 50 users: [ ] Pass / [ ] Fail
- [ ] Test with 100 users: [ ] Pass / [ ] Fail

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All services running and healthy
- ✅ Application accessible via browser
- ✅ Demo login works
- ✅ Can place test order
- ✅ Real-time updates working (Socket.io)
- ✅ Redis connected
- ✅ MongoDB connected
- ✅ No errors in logs

## 🆘 Rollback Plan

If deployment fails:

### 1. Stop Services
```bash
docker compose down
```

### 2. Check Logs
```bash
docker compose logs > deployment-error.log
```

### 3. Restore Previous Version
```bash
git checkout previous-working-commit
docker compose up --build -d
```

### 4. Report Issue
- Save error logs
- Document what went wrong
- Check troubleshooting guide

## 📞 Emergency Contacts

- AWS Support: [console.aws.amazon.com/support](https://console.aws.amazon.com/support)
- Docker Issues: [docs.docker.com](https://docs.docker.com)
- Application Logs: `docker compose logs -f`

## 📚 Reference Documents

- [ ] Read `DEPLOYMENT.md` - Complete guide
- [ ] Read `QUICK_DEPLOY.md` - Quick reference
- [ ] Read `AWS_FREE_TIER_INFO.md` - Cost info
- [ ] Review `docker-compose.yml` - Services
- [ ] Review `.env.example` - Configuration

## ✨ Final Check

Before running `setup-ec2.sh`:
- [ ] All items above checked
- [ ] SSH connection working
- [ ] Repository accessible
- [ ] Understand costs
- [ ] Ready to deploy

---

**Ready? Run `bash setup-ec2.sh` and go live! 🚀**

**Estimated time: 10 minutes**
