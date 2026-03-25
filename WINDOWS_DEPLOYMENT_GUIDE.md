# 🪟 Windows Deployment Guide

Complete guide for deploying from Windows to AWS EC2.

## 📋 Prerequisites

- ✅ AWS EC2 instance running (Ubuntu 22.04/24.04)
- ✅ PEM file: `C:\Users\jayakumar\Downloads\eeshuu-key.pem`
- ✅ EC2 Public IP address
- ✅ Security Group configured (ports 22, 80, 443)

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your EC2 IP Address

1. Open AWS Console: https://console.aws.amazon.com/ec2/
2. Click "Instances" → Select your instance
3. Copy the "Public IPv4 address"

### Step 2: Connect via SSH

**Using PowerShell (Recommended for Windows):**

```powershell
# Open PowerShell
# Navigate to PEM file location
cd C:\Users\jayakumar\Downloads

# Connect (replace YOUR_EC2_IP with actual IP)
ssh -i eeshuu-key.pem ubuntu@YOUR_EC2_IP
```

**First time connecting?** Type `yes` when asked about authenticity.

### Step 3: Deploy Application

Once connected to EC2:

```bash
# Clone repository
git clone https://github.com/adithya-parambil/eeshuu.git

# Navigate to project
cd eeshuu

# Run automated setup
bash setup-ec2.sh
```

**Wait 10 minutes** for complete setup.

## 🔧 Detailed Instructions

### A. Fix PEM File Permissions (If Needed)

If you get "UNPROTECTED PRIVATE KEY FILE" error:

**Method 1: Using File Properties (GUI)**
1. Right-click `eeshuu-key.pem`
2. Properties → Security tab
3. Click "Advanced"
4. Click "Disable inheritance"
5. Choose "Remove all inherited permissions"
6. Click "Add" → "Select a principal"
7. Type your username → Check names → OK
8. Check "Read" permission only
9. Apply → OK

**Method 2: Using PowerShell (Command)**
```powershell
# Remove inheritance
icacls "C:\Users\jayakumar\Downloads\eeshuu-key.pem" /inheritance:r

# Grant read permission to current user
icacls "C:\Users\jayakumar\Downloads\eeshuu-key.pem" /grant:r "$($env:USERNAME):(R)"
```

### B. Alternative SSH Methods

#### Using Git Bash (If Installed)

```bash
# Open Git Bash
cd /c/Users/jayakumar/Downloads

# Set permissions
chmod 400 eeshuu-key.pem

# Connect
ssh -i eeshuu-key.pem ubuntu@YOUR_EC2_IP
```

#### Using WSL (Windows Subsystem for Linux)

```bash
# Open WSL terminal
# Copy PEM to WSL
cp /mnt/c/Users/jayakumar/Downloads/eeshuu-key.pem ~/

# Set permissions
chmod 400 ~/eeshuu-key.pem

# Connect
ssh -i ~/eeshuu-key.pem ubuntu@YOUR_EC2_IP
```

#### Using PuTTY (Alternative)

1. Download PuTTYgen: https://www.putty.org/
2. Open PuTTYgen
3. Load your `eeshuu-key.pem` file
4. Save as `.ppk` file
5. Use PuTTY with the `.ppk` file

## 📊 What Happens During Setup

The `setup-ec2.sh` script will:

1. ✅ Update system packages (1 min)
2. ✅ Install Docker & Docker Compose (2 min)
3. ✅ Install Git (30 sec)
4. ✅ Generate secure secrets (5 sec)
5. ✅ Create `.env` configuration (5 sec)
6. ✅ Build all Docker images (5-7 min)
7. ✅ Start all services (1 min)
8. ✅ Wait for health checks (30 sec)
9. ✅ Seed demo data (30 sec)
10. ✅ Configure firewall (10 sec)

**Total time: ~10 minutes**

## ✅ Verify Deployment

### Check Services Status

```bash
docker compose ps
```

All services should show "Up" and "healthy".

### Check Application Health

```bash
curl http://localhost/health/live
```

Should return: `{"status":"ok"}`

### Access Application

Open browser: `http://YOUR_EC2_IP`

### Test Demo Login

```
Customer:  customer@demo.com  / Demo@1234
Delivery:  delivery@demo.com  / Demo@1234
Admin:     admin@demo.com     / Demo@1234
```

## 🛠️ Useful Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Restart Services
```bash
docker compose restart
```

### Stop Services
```bash
# Stop (keep data)
docker compose down

# Stop and wipe data
docker compose down -v
```

### Update Application
```bash
git pull
docker compose up --build -d
```

### Check Resource Usage
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

## 🔍 Troubleshooting

### Cannot Connect via SSH

**Check 1: Security Group**
- AWS Console → EC2 → Security Groups
- Ensure port 22 is open for your IP

**Check 2: Instance Running**
- AWS Console → EC2 → Instances
- Status should be "Running"

**Check 3: Correct Username**
- For Ubuntu AMI, use `ubuntu`
- For Amazon Linux, use `ec2-user`

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check disk space
df -h

# Restart services
docker compose restart
```

### Out of Memory

```bash
# Check memory
free -h

# Restart services to free memory
docker compose restart
```

### Can't Access Application

**Check 1: Security Group**
- Port 80 should be open to 0.0.0.0/0

**Check 2: Services Running**
```bash
docker compose ps
```

**Check 3: Health Check**
```bash
curl http://localhost/health/live
```

## 📱 Disconnect from EC2

To exit SSH session:
```bash
exit
```

Or press: `Ctrl + D`

## 🔄 Reconnect to EC2

```powershell
cd C:\Users\jayakumar\Downloads
ssh -i eeshuu-key.pem ubuntu@YOUR_EC2_IP
cd eeshuu
```

## 💰 Cost Reminder

Your m7i-flex.large instance costs:
- **~$0.10/hour**
- **~$2.42/day**
- **~$73/month**

**To stop instance (save costs):**
1. AWS Console → EC2 → Instances
2. Select instance → Instance State → Stop

**Note:** Stopping preserves data but you'll lose the public IP (unless using Elastic IP).

## 📚 Additional Resources

- `DEPLOYMENT.md` - Complete deployment guide
- `QUICK_DEPLOY.md` - Quick reference
- `AWS_FREE_TIER_INFO.md` - Cost analysis
- `PRE_DEPLOYMENT_CHECKLIST.md` - Pre-flight checklist

## 🆘 Need Help?

1. Check logs: `docker compose logs -f`
2. Verify services: `docker compose ps`
3. Check health: `curl http://localhost/health/live`
4. Review Security Group settings
5. Check disk space: `df -h`

## ✨ Success Checklist

After deployment, verify:
- [ ] Can SSH into EC2
- [ ] All services running (`docker compose ps`)
- [ ] Health check passes
- [ ] Can access app in browser
- [ ] Demo login works
- [ ] Can place test order
- [ ] Real-time updates working

---

**Ready to deploy? Follow the 3 steps above and you're live in 10 minutes! 🚀**
