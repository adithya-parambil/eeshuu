# 🚀 Complete AWS Deployment Guide for Eeshuu

This guide will walk you through deploying the Eeshuu application on AWS EC2 from scratch, even if you're new to AWS.

---

## 📋 Prerequisites

- AWS Account (create one at https://aws.amazon.com if you don't have it)
- Credit/Debit card for AWS verification (AWS Free Tier is available)
- Your local computer with internet access

---

## Part 1: Setting Up AWS Account & EC2 Instance

### Step 1.1: Create AWS Account

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Fill in:
   - Email address
   - Password
   - AWS account name (e.g., "eeshuu-deployment")
4. Choose "Personal" account type
5. Enter payment information (required for verification)
6. Verify your phone number
7. Select "Basic Support - Free" plan

### Step 1.2: Sign in to AWS Console

1. Go to https://console.aws.amazon.com
2. Sign in with your email and password
3. You'll see the AWS Management Console dashboard

### Step 1.3: Create EC2 Instance

**What is EC2?** It's a virtual server in the cloud where your application will run.

1. **Navigate to EC2:**
   - In the AWS Console search bar (top), type "EC2"
   - Click on "EC2" (Virtual Servers in the Cloud)

2. **Launch Instance:**
   - Click the orange "Launch Instance" button
   - You'll see a configuration page

3. **Configure Instance:**

   **Name and tags:**
   - Name: `eeshuu-server`

   **Application and OS Images (AMI):**
   - Select: **Ubuntu Server 22.04 LTS**
   - Architecture: **64-bit (x86)**
   - Keep "Free tier eligible" selected

   **Instance type:**
   - Select: **t2.medium** (2 vCPU, 4 GB RAM)
   - Note: t2.micro (free tier) has only 1GB RAM which is too small for Docker

   **Key pair (login):**
   - Click "Create new key pair"
   - Key pair name: `eeshuu-key`
   - Key pair type: **RSA**
   - Private key file format: 
     - **Windows**: Select `.ppk` if using PuTTY
     - **Mac/Linux**: Select `.pem`
   - Click "Create key pair"
   - **IMPORTANT**: The file will download automatically. Save it in a safe place!
     - Windows: Save to `C:\Users\YourName\.ssh\eeshuu-key.ppk`
     - Mac/Linux: Save to `~/.ssh/eeshuu-key.pem`

   **Network settings:**
   - Click "Edit" button
   - **VPC**: Keep default
   - **Subnet**: Keep default (No preference)
   - **Auto-assign public IP**: **Enable**
   - **Firewall (security groups)**: Create new security group
     - Security group name: `eeshuu-security-group`
     - Description: `Security group for Eeshuu application`
   
   **Security group rules** (Click "Add security group rule" for each):
   
   | Type | Protocol | Port Range | Source Type | Source | Description |
   |------|----------|------------|-------------|--------|-------------|
   | SSH | TCP | 22 | Anywhere | 0.0.0.0/0 | SSH access |
   | HTTP | TCP | 80 | Anywhere | 0.0.0.0/0 | Web traffic |
   | HTTPS | TCP | 443 | Anywhere | 0.0.0.0/0 | Secure web traffic |
   | Custom TCP | TCP | 3000 | Anywhere | 0.0.0.0/0 | Next.js (optional) |
   | Custom TCP | TCP | 5000 | Anywhere | 0.0.0.0/0 | Backend API (optional) |

   **Configure storage:**
   - Size: **20 GB** (minimum)
   - Volume type: **gp3** (General Purpose SSD)
   - Keep "Delete on termination" checked

4. **Review and Launch:**
   - Click "Launch instance" (orange button on the right)
   - Wait 2-3 minutes for the instance to start

5. **Get Your Instance Details:**
   - Click "View all instances"
   - Find your `eeshuu-server` instance
   - Wait until "Instance state" shows **Running** (green)
   - Note down the **Public IPv4 address** (e.g., `54.123.45.67`)
   - This is your `<EC2_PUBLIC_IP>`

---

## Part 2: Connecting to Your EC2 Instance

### For Windows Users (Using PuTTY)

1. **Download PuTTY** (if not installed):
   - Go to https://www.putty.org/
   - Download and install PuTTY

2. **Convert .ppk key (if needed)**:
   - If you downloaded `.pem` instead of `.ppk`:
     - Open PuTTYgen (comes with PuTTY)
     - Click "Load"
     - Select your `.pem` file
     - Click "Save private key"
     - Save as `eeshuu-key.ppk`

3. **Connect using PuTTY**:
   - Open PuTTY
   - **Host Name**: `ubuntu@<EC2_PUBLIC_IP>`
     - Example: `ubuntu@54.123.45.67`
   - **Port**: `22`
   - **Connection type**: SSH
   - In left sidebar: Connection → SSH → Auth → Credentials
   - **Private key file**: Browse and select `eeshuu-key.ppk`
   - Go back to "Session" in left sidebar
   - **Saved Sessions**: Type `eeshuu-server`
   - Click "Save" (so you don't have to re-enter next time)
   - Click "Open"
   - If you see a security alert, click "Accept"
   - You should now see a terminal with `ubuntu@ip-xxx-xxx-xxx-xxx:~$`

### For Mac/Linux Users (Using Terminal)

1. **Set correct permissions for key file**:
   ```bash
   chmod 400 ~/.ssh/eeshuu-key.pem
   ```

2. **Connect via SSH**:
   ```bash
   ssh -i ~/.ssh/eeshuu-key.pem ubuntu@<EC2_PUBLIC_IP>
   ```
   - Replace `<EC2_PUBLIC_IP>` with your actual IP
   - Example: `ssh -i ~/.ssh/eeshuu-key.pem ubuntu@54.123.45.67`
   - Type `yes` when asked about fingerprint
   - You should now see `ubuntu@ip-xxx-xxx-xxx-xxx:~$`

---

## Part 3: Installing Required Software on EC2

Now that you're connected to your server, run these commands one by one:

### Step 3.1: Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

This updates all system packages. Takes 2-3 minutes.

### Step 3.2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu

# Apply the group change
newgrp docker

# Verify Docker is installed
docker --version
```

You should see something like: `Docker version 24.0.7, build...`

### Step 3.3: Install Docker Compose

```bash
# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Verify installation
docker compose version
```

You should see: `Docker Compose version v2.x.x`

### Step 3.4: Install Git

```bash
sudo apt-get install -y git

# Verify
git --version
```

---

## Part 4: Clone and Configure Your Application

### Step 4.1: Clone Repository

```bash
# Clone your repository
git clone https://github.com/adithya-parambil/eeshuu.git

# Navigate into the directory
cd eeshuu

# Verify files are there
ls -la
```

You should see files like `docker-compose.yml`, `Dockerfile`, `README.md`, etc.

### Step 4.2: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

**In the nano editor**, update these values:

```bash
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=YourStrongPassword123!

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=your_64_character_random_string_here_make_it_very_long_and_random_1234
JWT_REFRESH_SECRET=another_64_character_random_string_different_from_above_5678_random

# URLs - Replace <EC2_PUBLIC_IP> with your actual IP
CLIENT_URL=http://<EC2_PUBLIC_IP>
NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>/api
NEXT_PUBLIC_SOCKET_URL=http://<EC2_PUBLIC_IP>

# Backend Configuration
PORT=5000
NODE_ENV=production

# Database
DB_URI=mongodb://admin:YourStrongPassword123!@mongodb:27017/eeshuu?authSource=admin

# Optional: Redis (uncomment if using)
# REDIS_URL=redis://redis:6379
```

**To save in nano:**
- Press `Ctrl + X`
- Press `Y` (yes to save)
- Press `Enter` (confirm filename)

### Step 4.3: Generate Strong JWT Secrets

If you want to generate proper random secrets:

```bash
# Generate JWT_ACCESS_SECRET
echo "JWT_ACCESS_SECRET=$(openssl rand -hex 64)"

# Generate JWT_REFRESH_SECRET
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)"
```

Copy these values and paste them into your `.env` file:

```bash
nano .env
```

Replace the JWT secrets with the generated ones, then save (`Ctrl+X`, `Y`, `Enter`).

---

## Part 5: Deploy the Application

### Step 5.1: Build and Start All Services

```bash
# Make sure you're in the eeshuu directory
cd ~/eeshuu

# Build and start all containers
docker compose up --build -d
```

**What this does:**
- `-d` means "detached mode" (runs in background)
- `--build` rebuilds the Docker images
- This will take 5-10 minutes the first time

**You'll see output like:**
```
[+] Building 234.5s (45/45) FINISHED
[+] Running 4/4
 ✔ Container mongodb   Started
 ✔ Container backend   Started
 ✔ Container frontend  Started
 ✔ Container nginx     Started
```

### Step 5.2: Verify Containers Are Running

```bash
docker compose ps
```

**Expected output:**
```
NAME        IMAGE              STATUS          PORTS
mongodb     mongo:7           Up (healthy)
backend     eeshuu-backend    Up (healthy)
frontend    eeshuu-frontend   Up
nginx       nginx:alpine      Up              0.0.0.0:80->80/tcp
```

All should show "Up" status. If any show "Exited", check logs:

```bash
# Check logs for a specific container
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb
docker compose logs nginx
```

### Step 5.3: Seed Demo Data

```bash
# Wait 30 seconds for MongoDB to be fully ready
sleep 30

# Seed the database with demo products and users
docker compose exec backend node dist/scripts/seed-demo-data.js
```

**Expected output:**
```
✓ Demo data seeded successfully
  - 12 products created
  - 3 users created (customer, delivery, admin)
```

---

## Part 6: Test Your Deployment

### Step 6.1: Test Health Endpoints

```bash
# Test if backend is responding
curl http://localhost/health/live

# Should return: {"status":"ok","uptime":123.45}

# Test readiness (checks MongoDB connection)
curl http://localhost/health/ready

# Should return: {"status":"ready","checks":[...]}
```

### Step 6.2: Test from Your Browser

1. **Open your browser**
2. **Go to**: `http://<EC2_PUBLIC_IP>`
   - Replace with your actual IP, e.g., `http://54.123.45.67`
3. **You should see**: The Eeshuu landing page with login/register

4. **Test Login**:
   - Email: `customer@demo.com`
   - Password: `Demo@1234`

5. **Test API**:
   - Go to: `http://<EC2_PUBLIC_IP>/api/v1/products`
   - You should see JSON with product list

6. **Test Health**:
   - Go to: `http://<EC2_PUBLIC_IP>/health/ready`
   - Should show: `{"status":"ready",...}`

---

## Part 7: Troubleshooting Common Issues

### Issue 1: Can't Access Website

**Check 1: Security Group**
```bash
# On your local computer, test if port 80 is open
telnet <EC2_PUBLIC_IP> 80
```

If it fails:
- Go to AWS Console → EC2 → Security Groups
- Find `eeshuu-security-group`
- Check "Inbound rules" has HTTP (port 80) from 0.0.0.0/0

**Check 2: Nginx is Running**
```bash
docker compose ps nginx
```

If not running:
```bash
docker compose logs nginx
docker compose restart nginx
```

### Issue 2: Backend Not Responding

```bash
# Check backend logs
docker compose logs backend --tail=50

# Common issues:
# - MongoDB connection failed: Check DB_URI in .env
# - Port already in use: Restart the container
docker compose restart backend
```

### Issue 3: MongoDB Connection Failed

```bash
# Check MongoDB is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb --tail=50

# Restart MongoDB
docker compose restart mongodb

# Wait 30 seconds, then restart backend
sleep 30
docker compose restart backend
```

### Issue 4: Frontend Not Loading

```bash
# Check frontend logs
docker compose logs frontend --tail=50

# Check if environment variables are correct
docker compose exec frontend env | grep NEXT_PUBLIC

# Rebuild frontend
docker compose up --build -d frontend
```

### Issue 5: Out of Memory

If containers keep crashing:

```bash
# Check memory usage
free -h

# If low memory, upgrade EC2 instance:
# AWS Console → EC2 → Select instance → Actions → Instance settings → Change instance type
# Choose t2.medium or t2.large
```

---

## Part 8: Useful Commands

### Managing Containers

```bash
# View all containers
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Rebuild and restart
docker compose up --build -d

# Remove everything (including data)
docker compose down -v
```

### Monitoring

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU usage
top
# Press 'q' to exit

# Check Docker resource usage
docker stats
```

### Updating Code

```bash
# Pull latest code
cd ~/eeshuu
git pull origin main

# Rebuild and restart
docker compose up --build -d

# Check if update worked
docker compose ps
```

---

## Part 9: Setting Up MongoDB Atlas (Optional but Recommended)

Using MongoDB Atlas (cloud database) is more reliable than running MongoDB in Docker.

### Step 9.1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Choose "Free" tier (M0 Sandbox)
4. Cloud Provider: **AWS**
5. Region: Choose closest to your EC2 region
6. Cluster Name: `eeshuu-cluster`
7. Click "Create"

### Step 9.2: Configure Database Access

1. In Atlas dashboard, click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Authentication Method: **Password**
4. Username: `eeshuu_admin`
5. Password: Click "Autogenerate Secure Password" (copy it!)
6. Database User Privileges: **Read and write to any database**
7. Click "Add User"

### Step 9.3: Configure Network Access

1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for testing)
4. Click "Confirm"

### Step 9.4: Get Connection String

1. Click "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: **Node.js**
5. Version: **4.1 or later**
6. Copy the connection string (looks like):
   ```
   mongodb+srv://eeshuu_admin:<password>@eeshuu-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 9.5: Update Your Application

```bash
# SSH into your EC2 instance
ssh -i ~/.ssh/eeshuu-key.pem ubuntu@<EC2_PUBLIC_IP>

# Edit .env file
cd ~/eeshuu
nano .env
```

Update the `DB_URI`:
```bash
DB_URI=mongodb+srv://eeshuu_admin:YOUR_PASSWORD@eeshuu-cluster.xxxxx.mongodb.net/eeshuu?retryWrites=true&w=majority
```

Replace:
- `YOUR_PASSWORD` with the password you copied
- `eeshuu-cluster.xxxxx` with your actual cluster address

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### Step 9.6: Update docker-compose.yml

```bash
nano docker-compose.yml
```

Comment out the MongoDB service (add `#` at the start of each line):

```yaml
  # mongodb:
  #   image: mongo:7
  #   container_name: mongodb
  #   ...
```

Save and restart:

```bash
docker compose down
docker compose up -d

# Seed data to Atlas
docker compose exec backend node dist/scripts/seed-demo-data.js
```

---

## Part 10: Cost Optimization

### AWS Free Tier Limits

- **EC2 t2.micro**: 750 hours/month free for 12 months (but too small for this app)
- **EC2 t2.medium**: ~$30-40/month (not free)
- **Data Transfer**: 15 GB/month free

### Reducing Costs

1. **Stop instance when not in use**:
   ```bash
   # AWS Console → EC2 → Select instance → Instance state → Stop
   ```
   - You only pay for storage when stopped (~$2/month for 20GB)
   - Start it again when needed

2. **Use MongoDB Atlas Free Tier**:
   - 512 MB storage free forever
   - Saves ~$10/month vs running MongoDB on EC2

3. **Use smaller instance for testing**:
   - t2.small (2GB RAM) costs ~$17/month
   - Might work if you disable some features

---

## Part 11: Next Steps

### Add Domain Name (Optional)

1. **Buy a domain** (e.g., from Namecheap, GoDaddy)
2. **Point domain to EC2**:
   - Add an A record: `@ → <EC2_PUBLIC_IP>`
   - Add an A record: `www → <EC2_PUBLIC_IP>`
3. **Update .env**:
   ```bash
   CLIENT_URL=http://yourdomain.com
   NEXT_PUBLIC_API_URL=http://yourdomain.com/api
   NEXT_PUBLIC_SOCKET_URL=http://yourdomain.com
   ```
4. **Restart**:
   ```bash
   docker compose up -d
   ```

### Add SSL/HTTPS (Optional)

1. **Install Certbot**:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   ```

2. **Get SSL certificate**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 🎉 Congratulations!

Your Eeshuu application is now live on AWS!

**Your URLs:**
- Frontend: `http://<EC2_PUBLIC_IP>`
- API: `http://<EC2_PUBLIC_IP>/api/v1`
- Health: `http://<EC2_PUBLIC_IP>/health/ready`

**Demo Credentials:**
- Customer: `customer@demo.com` / `Demo@1234`
- Delivery: `delivery@demo.com` / `Demo@1234`
- Admin: `admin@demo.com` / `Demo@1234`

---

## 📞 Need Help?

Common commands cheat sheet:

```bash
# SSH into server
ssh -i ~/.ssh/eeshuu-key.pem ubuntu@<EC2_PUBLIC_IP>

# Check status
docker compose ps

# View logs
docker compose logs -f

# Restart everything
docker compose restart

# Update code
git pull && docker compose up --build -d

# Check health
curl http://localhost/health/ready
```

**Remember**: Your EC2 instance costs money when running. Stop it when not needed!
