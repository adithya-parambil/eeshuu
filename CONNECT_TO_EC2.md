# 🔐 Connect to Your EC2 Instance

## Your PEM File Location
```
C:\Users\jayakumar\Downloads\eeshuu-key.pem
```

## Step 1: Get Your EC2 Public IP

1. Go to AWS Console: https://console.aws.amazon.com/ec2/
2. Click on "Instances" in the left sidebar
3. Find your instance (should be running)
4. Copy the "Public IPv4 address" (e.g., 54.123.45.67)

## Step 2: Connect via SSH

### Option A: Using PowerShell (Windows)

```powershell
# Navigate to the directory with your PEM file
cd C:\Users\jayakumar\Downloads

# Connect to EC2 (replace YOUR_EC2_IP with actual IP)
ssh -i eeshuu-key.pem ubuntu@YOUR_EC2_IP
```

### Option B: Using Git Bash (Windows)

```bash
# Navigate to the directory with your PEM file
cd /c/Users/jayakumar/Downloads

# Set correct permissions (Git Bash only)
chmod 400 eeshuu-key.pem

# Connect to EC2 (replace YOUR_EC2_IP with actual IP)
ssh -i eeshuu-key.pem ubuntu@YOUR_EC2_IP
```

### Option C: Using WSL (Windows Subsystem for Linux)

```bash
# Copy PEM file to WSL (run in WSL terminal)
cp /mnt/c/Users/jayakumar/Downloads/eeshuu-key.pem ~/

# Set correct permissions
chmod 400 ~/eeshuu-key.pem

# Connect to EC2 (replace YOUR_EC2_IP with actual IP)
ssh -i ~/eeshuu-key.pem ubuntu@YOUR_EC2_IP
```

## Step 3: Deploy Your Application

Once connected to EC2, run:

```bash
# Clone your repository
git clone https://github.com/adithya-parambil/eeshuu.git

# Navigate to the project
cd eeshuu

# Run the setup script
bash setup-ec2.sh
```

## Common Issues & Solutions

### Issue: "WARNING: UNPROTECTED PRIVATE KEY FILE!"

**Solution for PowerShell:**
```powershell
# Right-click eeshuu-key.pem → Properties → Security
# Remove all users except your account
# Give your account "Read" permission only
```

**Solution for Git Bash/WSL:**
```bash
chmod 400 eeshuu-key.pem
```

### Issue: "Connection refused" or "Connection timed out"

**Check Security Group:**
1. Go to EC2 Console → Security Groups
2. Find your instance's security group
3. Ensure port 22 is open for your IP:
   - Type: SSH
   - Protocol: TCP
   - Port: 22
   - Source: Your IP (or 0.0.0.0/0 for testing)

### Issue: "Permission denied (publickey)"

**Possible causes:**
1. Wrong PEM file
2. Wrong username (should be `ubuntu` for Ubuntu AMI)
3. Instance not fully started (wait 2-3 minutes after launch)

## Quick Reference

### Your Setup
- **PEM File**: `C:\Users\jayakumar\Downloads\eeshuu-key.pem`
- **Username**: `ubuntu`
- **EC2 IP**: `[Get from AWS Console]`

### Connection Command Template
```bash
ssh -i C:\Users\jayakumar\Downloads\eeshuu-key.pem ubuntu@YOUR_EC2_IP
```

### After Connecting
```bash
# Update system
sudo apt-get update

# Clone and deploy
git clone https://github.com/adithya-parambil/eeshuu.git
cd eeshuu
bash setup-ec2.sh
```

## Next Steps After Deployment

1. **Access your application**: `http://YOUR_EC2_IP`
2. **Check health**: `http://YOUR_EC2_IP/health/live`
3. **View logs**: `docker compose logs -f`
4. **Test demo login**: customer@demo.com / Demo@1234

## Need Help?

If you encounter issues:
1. Check Security Group settings (port 22, 80, 443)
2. Verify instance is running
3. Check logs: `docker compose logs -f`
4. Review `DEPLOYMENT.md` for troubleshooting

---

**Ready to connect? Get your EC2 IP from AWS Console and use the command above!**
