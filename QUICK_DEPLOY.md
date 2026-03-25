# ⚡ Quick Deploy Reference

## 🚀 One-Command Setup

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone and deploy
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
bash setup-ec2.sh
```

## ⏱️ Timeline
- **Setup**: 3-5 minutes
- **First build**: 5-8 minutes
- **Total**: ~10 minutes

## ✅ What You Get

- ✅ MongoDB (persistent storage)
- ✅ Redis (Socket.io scaling)
- ✅ Backend (Express + Socket.io)
- ✅ Frontend (Next.js)
- ✅ Nginx (reverse proxy)
- ✅ Auto-restart on reboot
- ✅ Demo data seeded

## 🔑 Demo Credentials

```
Customer:  customer@demo.com  / Demo@1234
Delivery:  delivery@demo.com  / Demo@1234
Admin:     admin@demo.com     / Demo@1234
```

## 📊 Essential Commands

```bash
# Status
docker compose ps

# Logs
docker compose logs -f backend

# Restart
docker compose restart

# Stop (keep data)
docker compose down

# Update app
git pull && docker compose up --build -d
```

## 💰 Cost (m7i-flex.large)

- **Hourly**: $0.10
- **Monthly**: ~$73
- **NOT Free Tier**

## 🔐 Security Group Ports

- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)

## 🆘 Troubleshooting

```bash
# Check health
curl http://localhost/health/live

# View all logs
docker compose logs

# Restart everything
docker compose restart

# Check resources
docker stats
```

## 📍 Access Your App

```
http://YOUR_EC2_IP
```

---

**Full guide**: See `DEPLOYMENT.md`
