<div align="center">

<br />

```
███████╗███████╗███████╗██╗  ██╗██╗   ██╗██╗   ██╗
██╔════╝██╔════╝██╔════╝██║  ██║██║   ██║██║   ██║
█████╗  █████╗  ███████╗███████║██║   ██║██║   ██║
██╔══╝  ██╔══╝  ╚════██║██╔══██║██║   ██║██║   ██║
███████╗███████╗███████║██║  ██║╚██████╔╝╚██████╔╝
╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝
```

**Real-Time Quick Commerce — Delivered in Seconds**

🚀 **Beeyond Tech Full-Stack + DevOps Assignment**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?style=flat-square&logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

### 🌐 Live Demo

**Frontend:** [https://eeshuu.qzz.io](https://eeshuu.qzz.io)  
**Backend API:** [https://eeshuu.qzz.io/api/v1](https://eeshuu.qzz.io/api/v1)  
**WebSocket:** `wss://eeshuu.qzz.io/socket.io`  
**Demo Video:** [Watch on YouTube](https://youtu.be/L9I2a-Co1RU)

</div>

---

## 📋 Project Overview

Eeshuu is a production-grade real-time quick commerce platform built for the Beeyond Tech assignment. It demonstrates full-stack development, DevOps practices, and real-time communication capabilities with end-to-end order tracking, live delivery partner GPS, and role-based dashboards — all self-hosted on AWS EC2, fully Dockerized, and served behind Nginx with SSL.

## 🎯 Assignment Requirements Met

✅ **Frontend:** Next.js 14 with App Router, fully responsive, self-hosted on AWS EC2  
✅ **Backend:** Node.js + Express.js with comprehensive REST APIs  
✅ **Database:** MongoDB 7 (self-hosted in Docker)  
✅ **Authentication:** JWT-based auth with role-based access control (Customer, Delivery Partner, Admin)  
✅ **Real-Time:** Socket.io for live order updates, delivery tracking, and order locking  
✅ **Hosting:** Self-hosted on AWS EC2 (m7i-flex.large) with Nginx reverse proxy  
✅ **Docker:** Complete containerization with docker-compose orchestration  
✅ **Health Monitoring:** `/health/live` and `/health/ready` endpoints  
✅ **SSL/HTTPS:** Production deployment with SSL certificates  
✅ **Demo Video:** Full walkthrough available on YouTube

---

## ✨ Key Features

Three roles, one system:

| Role | Capability |
|---|---|
| 🛒 **Customer** | Browse catalog, place orders, track live delivery on an interactive map |
| 🛵 **Delivery Partner** | Receive instant order notifications, accept via atomic lock, update status in real time |
| 🖥️ **Admin** | Monitor all orders, users, and live system activity from a unified dashboard |

---

## 🏗️ System Architecture

```
                    ┌──────────────────────────────────────────────────┐
                    │    AWS EC2 (m7i-flex.large - 2 vCPU, 8 GiB)     │
                    │    Region: ap-south-1 (Mumbai)                   │
                    │    Domain: eeshuu.qzz.io (Cloudflare DNS)       │
                    │                                                  │
                    │  ┌────────────────────────────────────────────┐ │
                    │  │         Nginx :80, :443 (SSL)              │ │
                    │  │                                            │ │
                    │  │  /          → frontend :3000               │ │
                    │  │  /api/      → backend  :5000               │ │
                    │  │  /socket.io/→ backend  :5000 (WebSocket)  │ │
                    │  │  /health/   → backend  :5000               │ │
                    │  └──────┬──────────────┬──────────────────────┘ │
                    │         │              │                         │
                    │  ┌──────▼──────┐ ┌────▼──────────────────────┐ │
                    │  │  Frontend   │ │    Backend                 │ │
                    │  │  Next.js 14 │ │  Express.js + Socket.io    │ │
                    │  │  Standalone │ │  TypeScript                │ │
                    │  │   :3000     │ │  JWT Auth + RBAC           │ │
                    │  └─────────────┘ │  Rate Limiting             │ │
                    │                  │  Idempotency               │ │
                    │                  │    :5000                   │ │
                    │                  └────┬───────────────────────┘ │
                    │                       │                          │
                    │               ┌───────▼──────────┐               │
                    │               │  MongoDB 7       │               │
                    │               │  (Docker Volume) │               │
                    │               │  Persistent Data │               │
                    │               │   :27017         │               │
                    │               └──────────────────┘               │
                    │                                                  │
                    │               ┌──────────────────┐               │
                    │               │  Redis 7         │               │
                    │               │  Socket.io       │               │
                    │               │  Adapter         │               │
                    │               │  (Horizontal     │               │
                    │               │   Scaling)       │               │
                    │               │   :6379          │               │
                    │               └──────────────────┘               │
                    └──────────────────────────────────────────────────┘

Browser / Mobile
  ├── HTTPS → https://eeshuu.qzz.io/api/v1/*    (REST APIs)
  └── WSS   → wss://eeshuu.qzz.io/socket.io/    (Real-time)
```

### Architecture Highlights

- **Single VM Deployment:** All services containerized and orchestrated via Docker Compose
- **Nginx Reverse Proxy:** SSL termination, load balancing, and routing
- **Stateless Backend:** Enables horizontal scaling with Redis adapter
- **Persistent Storage:** MongoDB data persisted in Docker volumes
- **Health Checks:** Docker-native health monitoring with auto-restart
- **Security:** Non-root containers, CORS restrictions, rate limiting, JWT rotation

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | Server-side rendering, routing, and React framework |
| | TypeScript | Type safety and developer experience |
| | Tailwind CSS | Utility-first styling |
| | Framer Motion | Smooth animations and transitions |
| | Zustand | Lightweight state management |
| | Leaflet | Interactive maps for delivery tracking |
| **Backend** | Node.js 20 + Express.js | REST API server |
| | TypeScript | Type-safe backend development |
| | Socket.io 4 | Real-time bidirectional communication |
| | Zod | Runtime schema validation |
| | Pino | Structured JSON logging |
| **Database** | MongoDB 7 | Document database with ACID transactions |
| | Mongoose | ODM with schema validation |
| **Authentication** | JWT | Stateless authentication |
| | bcrypt | Password hashing (12 rounds) |
| **Caching** | Redis 7 | Socket.io adapter, token blacklist, location cache |
| **Reverse Proxy** | Nginx (Alpine) | SSL termination, load balancing, static file serving |
| **Containerization** | Docker | Application containerization |
| | Docker Compose | Multi-container orchestration |
| **Cloud** | AWS EC2 | Virtual machine hosting |
| | Cloudflare | DNS management and CDN |
| **Maps** | OpenStreetMap | Base map tiles (CartoDB dark theme) |
| | OpenCage Geocoding | Address to coordinates conversion |

---

## 📂 Folder Structure

```
eeshuu/
├── app/                          # Next.js 14 App Router pages
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Registration page
│   └── (app)/                    # Protected application routes
│       ├── dashboard/page.tsx    # Customer product catalog
│       ├── orders/               # Customer order management
│       │   ├── page.tsx          # Order list
│       │   └── [id]/page.tsx     # Order detail with live tracking
│       ├── delivery/             # Delivery partner dashboard
│       │   ├── orders/page.tsx   # Available orders feed
│       │   ├── active/page.tsx   # Active delivery with GPS tracking
│       │   ├── history/page.tsx  # Completed deliveries
│       │   └── earnings/page.tsx # Commission and earnings stats
│       ├── admin/                # Admin dashboard
│       │   ├── dashboard/page.tsx # Live stats and activity feed
│       │   ├── orders/page.tsx    # All orders management
│       │   ├── users/page.tsx     # User management
│       │   ├── products/page.tsx  # Product catalog management
│       │   └── disputes/page.tsx  # Dispute resolution
│       ├── wallet/page.tsx       # Delivery partner wallet
│       └── disputes/page.tsx     # Customer dispute filing
│
├── backend/
│   └── src/
│       ├── config/               # Environment validation and module configs
│       │   ├── env.ts            # Zod schema for env validation
│       │   └── modules/          # Feature-specific configs
│       │       ├── cors.config.ts
│       │       ├── db.config.ts
│       │       ├── jwt.config.ts
│       │       ├── rate-limit.config.ts
│       │       ├── redis.config.ts
│       │       └── socket.config.ts
│       ├── middleware/           # Express middleware
│       │   ├── auth.middleware.ts      # JWT verification
│       │   ├── role.guard.ts           # Role-based access control
│       │   ├── validate.middleware.ts  # Zod schema validation
│       │   ├── rate-limiter.ts         # Rate limiting
│       │   ├── idempotency.middleware.ts # Idempotent requests
│       │   ├── error-handler.ts        # Global error handling
│       │   └── async-handler.ts        # Async route wrapper
│       ├── modules/              # Feature modules (routes + controllers)
│       │   ├── auth/             # Authentication (register, login, refresh)
│       │   ├── order/            # Order management
│       │   ├── product/          # Product catalog
│       │   ├── admin/            # Admin operations
│       │   ├── wallet/           # Wallet and transactions
│       │   ├── payment/          # Payment processing
│       │   ├── dispute/          # Dispute management
│       │   ├── rating/           # Order ratings
│       │   ├── user/             # User profile management
│       │   └── health/           # Health check endpoints
│       ├── repositories/         # Data access layer (CQRS pattern)
│       │   ├── models/           # Mongoose schemas
│       │   ├── read/             # Read-optimized queries
│       │   └── write/            # Write operations
│       ├── services/             # Business logic
│       │   ├── order-state-machine.ts  # Order status transitions
│       │   └── pricing.service.ts      # Dynamic pricing
│       ├── socket/               # Socket.io real-time engine
│       │   ├── engine.ts         # Socket.io server setup
│       │   ├── namespaces/       # Namespace handlers (/order, /admin)
│       │   ├── events/           # Event catalog and types
│       │   └── middleware/       # Socket authentication
│       ├── use-cases/            # Application use cases
│       │   └── order/            # Order-related use cases
│       ├── utils/                # Utility functions
│       │   ├── logger.ts         # Pino logger
│       │   ├── token.utils.ts    # JWT utilities
│       │   ├── blacklist.ts      # Token blacklist (Redis)
│       │   └── location-cache.ts # GPS location cache
│       ├── app.ts                # Express app setup
│       └── index.ts              # Entry point
│
├── components/                   # React component library
│   ├── atoms/                    # Basic building blocks
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── spinner.tsx
│   │   └── status-badge.tsx
│   ├── molecules/                # Composite components
│   │   ├── order-card.tsx        # Order summary card
│   │   ├── delivery-map.tsx      # Live delivery tracking map
│   │   ├── product-card.tsx      # Product display card
│   │   ├── cart-drawer.tsx       # Shopping cart
│   │   └── live-feed.tsx         # Real-time activity feed
│   ├── organisms/                # Complex components
│   │   └── order-table.tsx       # Admin order management table
│   └── layout/                   # Layout components
│       ├── app-shell.tsx         # Main app layout with navigation
│       ├── nav-sidebar.tsx       # Desktop sidebar navigation
│       └── mobile-nav.tsx        # Mobile bottom navigation
│
├── hooks/                        # Custom React hooks
│   ├── use-order-socket.ts       # Order namespace socket connection
│   └── use-admin-socket.ts       # Admin namespace socket connection
│
├── lib/                          # Shared libraries
│   ├── api/
│   │   └── client.ts             # Axios client with JWT interceptors
│   ├── socket-client.ts          # Socket.io client wrapper
│   └── geocode-picker.ts         # Geocoding utilities
│
├── store/                        # Zustand state management
│   ├── auth.store.ts             # Authentication state
│   ├── customer.store.ts         # Customer cart and orders
│   └── delivery.store.ts         # Delivery partner state
│
├── types/                        # Shared TypeScript types
│   └── index.ts                  # Common type definitions
│
├── nginx/                        # Nginx configuration
│   ├── nginx.conf                # HTTP reverse proxy config
│   └── nginx.ssl.conf            # HTTPS/SSL configuration
│
├── docker-compose.yml            # Multi-container orchestration
├── Dockerfile                    # Frontend container
├── backend/Dockerfile            # Backend container
├── .env.example                  # Environment variable template
├── setup-ec2.sh                  # Automated EC2 setup script
├── deploy-ssl.sh                 # SSL deployment script
└── README.md                     # This file
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Git** - Version control
- **Docker 24+** and **Docker Compose 2.20+** - Container runtime
- **SSH key pair** - For EC2 access
- **AWS Account** - For EC2 instance (or any cloud provider)

---

### Step 1: Provision EC2 Instance

1. **Launch EC2 Instance:**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: `m7i-flex.large` (2 vCPU, 8 GiB RAM) or `t2.medium` (free tier)
   - Storage: 25 GiB gp3
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Note your instance details:**
   - Public IP address
   - PEM key file location

---

### Step 2: SSH into EC2

```bash
# Replace with your actual PEM file path and EC2 public IP
ssh -i ~/.ssh/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

For Windows users with Git Bash:
```bash
ssh -i /c/Users/YourName/Downloads/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

### Step 3: Install Docker

```bash
# Update package index
sudo apt-get update

# Install Docker using official script
curl -fsSL https://get.docker.com | sudo sh

# Add current user to docker group
sudo usermod -aG docker $USER && newgrp docker

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

Expected output:
```
Docker version 24.x.x
Docker Compose version v2.20.x
```

---

### Step 4: Clone Repository

```bash
git clone https://github.com/adithya-parambil/eeshuu.git
cd eeshuu
```

---

### Step 5: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit environment file
nano .env
```

**Required configuration:**

```bash
# MongoDB credentials
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<strong_password>

# JWT secrets (generate with: openssl rand -hex 64)
JWT_ACCESS_SECRET=<64_character_secret>
JWT_REFRESH_SECRET=<64_character_secret>

# Frontend and backend URLs
CLIENT_URL=http://<EC2_PUBLIC_IP>
NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>/api
NEXT_PUBLIC_SOCKET_URL=http://<EC2_PUBLIC_IP>

# For production with domain and SSL:
# CLIENT_URL=https://yourdomain.com
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api
# NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
```

**Generate JWT secrets:**
```bash
echo "JWT_ACCESS_SECRET=$(openssl rand -hex 64)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)"
```

Save and exit (Ctrl+O, Enter, Ctrl+X in nano).

---

### Step 6: Build and Start Services

```bash
# Build and start all containers in detached mode
docker compose up --build -d
```

This command will:
1. Build the frontend Docker image (Next.js standalone)
2. Build the backend Docker image (Node.js + Express)
3. Pull MongoDB 7 and Redis 7 images
4. Pull Nginx Alpine image
5. Create Docker network and volumes
6. Start all containers with health checks

**Wait for services to be healthy (30-60 seconds):**

```bash
# Check container status
docker compose ps
```

Expected output:
```
NAME        IMAGE             STATUS                    PORTS
mongodb     mongo:7           Up (healthy)              0.0.0.0:27017->27017/tcp
redis       redis:7-alpine    Up (healthy)              6379/tcp
backend     eeshuu-backend    Up (healthy)              5000/tcp
frontend    eeshuu-frontend   Up                        3000/tcp
nginx       nginx:alpine      Up                        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

### Step 7: Seed Demo Data

```bash
# Populate database with demo users, products, and orders
docker compose exec backend npx tsx scripts/seed-demo-data.ts
```

This creates:
- 3 demo users (customer, delivery partner, admin)
- 20 sample products across 4 categories
- 5 sample orders in various states

---

### Step 8: Verify Deployment

```bash
# Test health endpoints
curl http://<EC2_PUBLIC_IP>/health/live
# Expected: {"status":"ok","uptime":123.45}

curl http://<EC2_PUBLIC_IP>/health/ready
# Expected: {"status":"ready","checks":[{"name":"mongodb","status":"pass"}]}

# Test API
curl http://<EC2_PUBLIC_IP>/api/v1/products
# Expected: JSON array of products
```

**Open in browser:**
```
http://<EC2_PUBLIC_IP>
```

You should see the Eeshuu landing page.

---

### Step 9: Test the Application

Login with demo credentials:

| Role | Email | Password |
|---|---|---|
| 🛒 Customer | `customer@demo.com` | `Demo@1234` |
| 🛵 Delivery Partner | `delivery@demo.com` | `Demo@1234` |
| 🖥️ Admin | `admin@demo.com` | `Demo@1234` |

**Customer Flow:**
1. Browse products on dashboard
2. Add items to cart
3. Place order
4. Track order status in real-time
5. View delivery partner location on map

**Delivery Partner Flow:**
1. View available orders
2. Accept an order (atomic lock)
3. Update status: Picked Up → On the Way → Delivered
4. View earnings and commission

**Admin Flow:**
1. Monitor live activity feed
2. View all orders and users
3. Manage products and disputes
4. See real-time statistics

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🛒 Customer | `customer@demo.com` | `Demo@1234` |
| 🛵 Delivery Partner | `delivery@demo.com` | `Demo@1234` |
| 🖥️ Admin | `admin@demo.com` | `Demo@1234` |

---

## API Reference

**Base path:** `/api/v1`

<details>
<summary><strong>Authentication</strong></summary>

```
POST  /auth/register     Register (customer or delivery role)
POST  /auth/login        Login → returns accessToken + refreshToken
POST  /auth/refresh      Rotate tokens using refreshToken
POST  /auth/logout       Revoke current access token (blacklist jti)
```

</details>

<details>
<summary><strong>Products</strong></summary>

```
GET    /products          List products (paginated, category filter)
GET    /products/:id      Get single product
POST   /products          Create product (admin only)
PUT    /products/:id      Update product (admin only)
DELETE /products/:id      Delete product (admin only)
```

</details>

<details>
<summary><strong>Orders — Customer</strong></summary>

```
POST  /orders              Place order (idempotent via Idempotency-Key header)
GET   /orders              List my orders
GET   /orders/:id          Get order detail
POST  /orders/:id/cancel   Cancel order (PENDING status only)
```

</details>

<details>
<summary><strong>Orders — Delivery Partner</strong></summary>

```
GET   /orders/available       List unassigned PENDING orders
GET   /orders/my-active       Get my current active order
GET   /orders/my-history      Get my completed orders
POST  /orders/:id/accept      Accept order (atomic lock)
PUT   /orders/:id/status      Update status (PICKED_UP → ON_THE_WAY → DELIVERED)
GET   /orders/:id/location    Get last known partner location (Redis cache)
```

</details>

<details>
<summary><strong>Admin</strong></summary>

```
GET   /admin/orders    All orders (paginated, filterable)
GET   /admin/users     All users (paginated)
GET   /admin/stats     System statistics
```

</details>

<details>
<summary><strong>Health</strong></summary>

```
GET   /health/live     Liveness probe — always 200 if process is up
GET   /health/ready    Readiness probe — checks MongoDB (and Redis if configured)
```

</details>

---

## 🔌 WebSocket Flow Explanation

### Connection Architecture

Eeshuu uses Socket.io for real-time bidirectional communication with two namespaces:

- **`/order`** - Customer and delivery partner real-time updates
- **`/admin`** - Admin dashboard live monitoring

### Authentication

All Socket.io connections require JWT authentication in the handshake:

```javascript
const socket = io('https://eeshuu.qzz.io/order', {
  auth: { token: localStorage.getItem('access_token') }
})
```

The backend validates the token and attaches user info to the socket instance.

### Room Architecture

```
delivery:pool          All online delivery partners waiting for orders
user:{userId}          Personal room for each user (private notifications)
order:{orderId}        All parties tracking a specific order
admin:dashboard        All connected admin sockets
```

### Complete Order Lifecycle with WebSocket Events

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. CUSTOMER PLACES ORDER (REST API)                                 │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─► Backend creates order in MongoDB
         │
         └─► Emit: v1:ORDER:NEW
             ├─► To: delivery:pool (all online delivery partners)
             └─► To: admin:dashboard (all admin sockets)
             
             Payload: { orderId, customer, items, total, pickupAddress }

┌─────────────────────────────────────────────────────────────────────┐
│ 2. DELIVERY PARTNER ACCEPTS ORDER (WebSocket)                       │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─► Partner emits: v1:ORDER:ACCEPT { orderId }
         │
         ├─► Backend performs atomic lock:
         │   findOneAndUpdate({ _id, status: 'PENDING', deliveryPartnerId: null })
         │   First partner to execute wins, others get "already assigned" error
         │
         └─► On success:
             ├─► Partner joins room: order:{orderId}
             ├─► Partner leaves room: delivery:pool
             │
             └─► Emit: v1:ORDER:ACCEPTED
                 ├─► To: user:{customerId} (customer notification)
                 ├─► To: order:{orderId} (all tracking this order)
                 └─► To: admin:dashboard
                 
                 Payload: { orderId, partner: { name, phone }, status: 'ACCEPTED' }

┌─────────────────────────────────────────────────────────────────────┐
│ 3. DELIVERY PARTNER UPDATES STATUS (WebSocket)                      │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─► Partner emits: v1:ORDER:UPDATE_STATUS
         │   { orderId, status: 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' }
         │
         ├─► Backend validates state machine transition:
         │   ACCEPTED → PICKED_UP → ON_THE_WAY → DELIVERED
         │
         ├─► On DELIVERED:
         │   ├─► Calculate commission (10% of order total)
         │   └─► Credit to delivery partner wallet
         │
         └─► Emit: v1:ORDER:STATUS_UPDATED
             ├─► To: order:{orderId}
             ├─► To: user:{customerId}
             └─► To: admin:dashboard
             
             Payload: { orderId, status, updatedAt, commission? }

┌─────────────────────────────────────────────────────────────────────┐
│ 4. DELIVERY PARTNER SENDS GPS LOCATION (WebSocket, every ~3s)       │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─► Partner emits: v1:PARTNER:LOCATION
         │   { orderId, lat, lng, timestamp }
         │
         ├─► Backend writes to Redis (NOT MongoDB):
         │   SET location:{orderId} { lat, lng, timestamp } EX 300
         │   (5-minute expiry, no database writes for performance)
         │
         └─► Emit: v1:ORDER:LOCATION_UPDATED
             ├─► To: order:{orderId} (customer sees live marker)
             └─► To: admin:dashboard (admin sees all active deliveries)
             
             Payload: { orderId, location: { lat, lng }, timestamp }

┌─────────────────────────────────────────────────────────────────────┐
│ 5. CUSTOMER CANCELS ORDER (REST API)                                │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─► Only allowed if status is 'PENDING' or 'ACCEPTED'
         │
         └─► Emit: v1:ORDER:CANCELLED
             ├─► To: order:{orderId}
             ├─► To: user:{customerId}
             ├─► To: user:{partnerId} (if assigned)
             └─► To: admin:dashboard
             
             Payload: { orderId, status: 'CANCELLED', reason }

┌─────────────────────────────────────────────────────────────────────┐
│ 6. DELIVERY PARTNER DISCONNECTS                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         └─► Emit: v1:PARTNER:OFFLINE
             ├─► To: admin:dashboard
             └─► To: order:{activeOrderId} (if partner has active order)
             
             Customer sees "LAST KNOWN LOCATION" badge on map
             Location data remains in Redis for 5 minutes
```

### Reconnection Handling

When a client reconnects after a brief disconnect:

1. **Automatic reconnection** - Socket.io handles reconnection with exponential backoff
2. **Re-authentication** - JWT token is re-validated on reconnect
3. **State recovery** - Client fetches latest order status via REST API
4. **Room re-join** - Client emits `join:order` to rejoin order room
5. **Resume updates** - Live location updates resume automatically

No state is lost on brief disconnects. For longer disconnects, the client shows a "reconnecting" indicator.

### Error Handling

All WebSocket events include error handling:

```javascript
socket.on('v1:ORDER:ACCEPT', async (data, callback) => {
  try {
    // Atomic lock logic
    callback({ success: true, order })
  } catch (error) {
    callback({ success: false, error: error.message })
  }
})
```

Clients receive immediate feedback via callback functions.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Backend port |
| `NODE_ENV` | Yes | — | `production` or `development` |
| `DB_URI` | Yes | — | MongoDB connection string |
| `DB_RETRY_ATTEMPTS` | No | `5` | MongoDB connection retries |
| `DB_RETRY_DELAY_MS` | No | `3000` | Delay between retries (ms) |
| `JWT_ACCESS_SECRET` | Yes | — | Min 64 chars |
| `JWT_REFRESH_SECRET` | Yes | — | Min 64 chars |
| `JWT_ACCESS_TTL_SECONDS` | No | `900` | Access token lifetime (15 min) |
| `JWT_REFRESH_TTL_SECONDS` | No | `604800` | Refresh token lifetime (7 days) |
| `BCRYPT_ROUNDS` | No | `12` | Password hash rounds (min 10) |
| `CLIENT_URL` | Yes | — | Frontend origin for CORS |
| `REDIS_URL` | No | — | Redis URL (enables Redis adapter) |
| `RATE_LIMIT_AUTH_MAX` | No | `10` | Auth requests per window |
| `RATE_LIMIT_AUTH_WINDOW` | No | `900000` | Auth rate limit window (ms) |
| `RATE_LIMIT_GENERAL_MAX` | No | `100` | General requests per window |
| `RATE_LIMIT_GENERAL_WINDOW` | No | `60000` | General rate limit window (ms) |
| `LOG_LEVEL` | No | `info` | `fatal\|error\|warn\|info\|debug` |
| `METRICS_ENABLED` | No | `false` | Enable Prometheus metrics |
| `NEXT_PUBLIC_API_URL` | Yes | — | Browser-facing API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | — | Browser-facing Socket.io URL |
| `MONGO_ROOT_USERNAME` | Yes | — | MongoDB root user |
| `MONGO_ROOT_PASSWORD` | Yes | — | MongoDB root password |

---

## 📈 Scaling Plan

### Current Architecture (Single Instance)

The current deployment runs all services on a single EC2 instance, which is suitable for:
- Development and testing
- Small to medium traffic (up to 100 concurrent users)
- Proof of concept demonstrations

### Horizontal Scaling with Redis

To scale beyond a single instance, Redis is already configured as the Socket.io adapter:

**Step 1: Redis is already enabled**
```yaml
# docker-compose.yml (already configured)
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

**Step 2: Backend auto-detects Redis**
```typescript
// backend/src/socket/engine.ts
if (process.env.REDIS_URL) {
  io.adapter(createAdapter(redisClient, redisClient.duplicate()))
  // All Socket.io events now broadcast across instances
}
```

### Load Balancer Architecture

```
                    ┌─────────────────────────────┐
                    │   AWS Application           │
                    │   Load Balancer (ALB)       │
                    │   - Sticky sessions: ON     │
                    │   - Health checks: /health  │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
       │   EC2 #1    │  │   EC2 #2   │  │   EC2 #3   │
       │  Backend +  │  │  Backend +  │  │  Backend + │
       │  Frontend   │  │  Frontend   │  │  Frontend  │
       │  + Nginx    │  │  + Nginx    │  │  + Nginx   │
       └──────┬──────┘  └─────┬──────┘  └─────┬──────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   ElastiCache       │
                    │   (Redis)           │
                    │   - Socket.io       │
                    │     adapter         │
                    │   - Token blacklist │
                    │   - Location cache  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   MongoDB Atlas     │
                    │   (Replica Set)     │
                    │   - M10 cluster     │
                    │   - Auto-failover   │
                    └─────────────────────┘
```

### Scaling Steps

**1. Enable sticky sessions on load balancer:**
```bash
# AWS ALB
aws elbv2 modify-target-group-attributes \
  --target-group-arn <arn> \
  --attributes Key=stickiness.enabled,Value=true \
               Key=stickiness.type,Value=lb_cookie \
               Key=stickiness.lb_cookie.duration_seconds,Value=86400
```

**2. Use managed Redis (AWS ElastiCache):**
```bash
# Update .env on all instances
REDIS_URL=redis://your-elasticache-endpoint:6379
```

**3. Use MongoDB Atlas (managed replica set):**
```bash
# Update .env on all instances
DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eeshuu?retryWrites=true&w=majority
```

**4. Deploy to multiple EC2 instances:**
```bash
# On each instance
git clone https://github.com/adithya-parambil/eeshuu.git
cd eeshuu
cp .env.example .env
# Configure .env with shared Redis and MongoDB
docker compose up --build -d
```

**5. Configure ALB health checks:**
- Health check path: `/health/ready`
- Healthy threshold: 2
- Unhealthy threshold: 3
- Interval: 30 seconds
- Timeout: 5 seconds

### Auto-Scaling Configuration

**Target Tracking Scaling Policy:**
- Metric: Average CPU Utilization
- Target: 70%
- Min instances: 2
- Max instances: 10
- Scale-out cooldown: 300 seconds
- Scale-in cooldown: 300 seconds

**Scaling Triggers:**
- CPU > 70% for 2 minutes → Add 1 instance
- CPU < 30% for 5 minutes → Remove 1 instance
- Request count > 1000/min per instance → Add 1 instance

### Database Scaling

**MongoDB Atlas M10 Cluster:**
- 3-node replica set (1 primary, 2 secondaries)
- Auto-failover in <30 seconds
- Read preference: `secondaryPreferred` for read-heavy operations
- Connection pooling: 100 connections per instance

**Read/Write Separation:**
```typescript
// Read from secondaries for non-critical queries
const products = await Product.find().read('secondaryPreferred')

// Write to primary (default)
const order = await Order.create(orderData)
```

### Caching Strategy

**Redis Cache Layers:**
1. **Location cache** - GPS coordinates (5-minute TTL)
2. **Token blacklist** - Revoked JWTs (TTL = token expiry)
3. **Product catalog** - Frequently accessed products (1-hour TTL)
4. **User sessions** - Active user data (15-minute TTL)

### Cost Estimation (AWS)

| Component | Configuration | Monthly Cost |
|---|---|---|
| EC2 (3x m7i-flex.large) | 2 vCPU, 8 GiB each | ~$220 |
| ALB | 1 load balancer | ~$25 |
| ElastiCache (Redis) | cache.t3.micro | ~$15 |
| MongoDB Atlas | M10 cluster | ~$60 |
| Data Transfer | 1 TB/month | ~$90 |
| **Total** | | **~$410/month** |

For comparison, single instance cost: ~$73/month

### Performance Targets

| Metric | Single Instance | Scaled (3 instances) |
|---|---|---|
| Concurrent users | 100 | 1,000+ |
| Requests/second | 50 | 500+ |
| WebSocket connections | 100 | 3,000+ |
| P95 latency | <200ms | <100ms |
| Availability | 99% | 99.9% |

---

## 📊 Hosting & Deployment Details

### Infrastructure

**Cloud Provider:** AWS (Amazon Web Services)  
**Region:** ap-south-1 (Mumbai)  
**Instance Type:** m7i-flex.large  
**Specifications:**
- 2 vCPU (Intel Xeon Scalable processors)
- 8 GiB RAM
- 25 GiB gp3 SSD storage
- Up to 12.5 Gbps network bandwidth

**Operating System:** Ubuntu Server 22.04 LTS

**Domain:** eeshuu.qzz.io (managed via Cloudflare DNS)

**SSL Certificate:** Cloudflare Origin Certificate (TLS 1.2/1.3)

### Network Configuration

**Security Group Rules:**
```
Inbound:
- Port 22 (SSH)    - Source: My IP only
- Port 80 (HTTP)   - Source: 0.0.0.0/0 (redirects to HTTPS)
- Port 443 (HTTPS) - Source: 0.0.0.0/0

Outbound:
- All traffic allowed
```

**Elastic IP:** Static IP address attached to EC2 instance

### Container Architecture

**Docker Compose Services:**

| Service | Image | Exposed Ports | Health Check |
|---|---|---|---|
| `nginx` | nginx:alpine | 80, 443 | N/A |
| `frontend` | eeshuu-frontend:latest | Internal 3000 | N/A |
| `backend` | eeshuu-backend:latest | Internal 5000 | `/health/live` |
| `mongodb` | mongo:7 | Internal 27017 | `mongosh ping` |
| `redis` | redis:7-alpine | Internal 6379 | `redis-cli ping` |

**Docker Volumes:**
- `mongo-data` - MongoDB persistent storage
- `redis-data` - Redis persistent storage

**Docker Network:**
- `app-network` - Bridge network for inter-container communication

### Deployment Process

1. **Code push to GitHub** - Developer pushes code to main branch
2. **SSH into EC2** - Connect to production server
3. **Pull latest code** - `git pull origin main`
4. **Rebuild containers** - `docker compose up --build -d`
5. **Health check** - Verify all services are healthy
6. **Smoke test** - Test critical user flows

**Deployment time:** ~3-5 minutes (including build and health checks)

**Zero-downtime deployment:** Not yet implemented (future: blue-green deployment)

### Monitoring

**Health Endpoints:**
- `GET /health/live` - Liveness probe (process alive)
- `GET /health/ready` - Readiness probe (dependencies healthy)

**Docker Health Checks:**
```yaml
backend:
  healthcheck:
    test: ["CMD", "wget", "-qO-", "http://localhost:5000/health/live"]
    interval: 30s
    timeout: 5s
    retries: 3
    start_period: 15s
```

**Logging:**
```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100 backend
```

### Backup Strategy

**MongoDB Backups:**
```bash
# Manual backup
docker compose exec mongodb mongodump --out=/backup --authenticationDatabase=admin

# Restore from backup
docker compose exec mongodb mongorestore /backup --authenticationDatabase=admin
```

**Automated backups:** Not yet implemented (future: daily backups to S3)

### SSL/TLS Configuration

**Certificate:** Cloudflare Origin Certificate  
**Protocols:** TLS 1.2, TLS 1.3  
**Cipher Suites:** Modern, secure ciphers only  
**HSTS:** Enabled (max-age=31536000, includeSubDomains)

**Security Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer-when-downgrade
X-XSS-Protection: 1; mode=block
```

### Cost Breakdown (Monthly)

| Resource | Cost |
|---|---|
| EC2 m7i-flex.large (730 hours) | $73.00 |
| EBS gp3 storage (25 GiB) | $2.00 |
| Data transfer out (100 GB) | $9.00 |
| Elastic IP (attached) | $0.00 |
| **Total** | **$84.00/month** |

**Note:** Actual costs may vary based on usage and data transfer.

---

## Security

| Measure | Detail |
|---|---|
| **JWT rotation** | 15-min access tokens + 7-day refresh tokens, rotated on every use |
| **Reuse detection** | Replayed refresh tokens revoke all sessions for that user |
| **JTI blacklist** | Revoked tokens rejected for remaining TTL after logout |
| **Password hashing** | bcrypt at 12 rounds |
| **Security headers** | Helmet.js on all responses |
| **CORS** | Restricted to `CLIENT_URL` only |
| **Rate limiting** | 10 req/15 min on auth; 100 req/min globally |
| **Input validation** | Zod schema validation on all request bodies |
| **Query safety** | MongoDB queries use `$eq` to prevent injection |
| **Containers** | Non-root user in all Docker containers |
| **Network** | Only Nginx port 80 exposed publicly |

---

## Logs

```bash
docker compose logs -f            # All services
docker compose logs -f backend    # Backend only
docker compose logs -f nginx      # Nginx access log
```

---

## Useful Commands

```bash
# Start
docker compose up --build -d

# Stop (keep data)
docker compose down

# Stop and wipe database
docker compose down -v

# Seed demo data
docker compose exec backend node dist/scripts/seed-demo-data.js

# Scale backend
docker compose up --scale backend=3 -d
```

---

## 🔮 Future Improvements

### Security Enhancements
- **Rate limiting per user** - Currently per IP, add per-user limits for authenticated endpoints
- **2FA authentication** - TOTP-based two-factor authentication for admin accounts
- **API key management** - For third-party integrations
- **Content Security Policy** - Stricter CSP headers to prevent XSS
- **DDoS protection** - Cloudflare Pro with advanced DDoS mitigation

### Performance Optimizations
- **CDN integration** - CloudFront or Cloudflare CDN for static assets
- **Image optimization** - WebP format with lazy loading
- **Database indexing** - Compound indexes for complex queries
- **Query optimization** - Aggregation pipeline optimization for analytics
- **Connection pooling** - Optimized MongoDB connection pool size

### Feature Additions
- **Push notifications** - Web Push API or Firebase FCM for background updates
- **SMS notifications** - Twilio integration for order status updates
- **Email notifications** - SendGrid for order confirmations and receipts
- **Payment gateway** - Real Razorpay integration with webhook verification
- **Promo codes** - Discount and coupon system
- **Referral program** - Customer referral rewards
- **Ratings and reviews** - Product and delivery partner ratings
- **Chat support** - Real-time customer support chat
- **Analytics dashboard** - Business intelligence and reporting

### DevOps Improvements
- **CI/CD pipeline** - GitHub Actions for automated testing and deployment
  ```yaml
  # .github/workflows/deploy.yml
  - Lint and type check
  - Run unit tests
  - Build Docker images
  - Push to ECR
  - Deploy to EC2 via SSH
  - Run smoke tests
  ```
- **Infrastructure as Code** - Terraform for AWS resource provisioning
- **Kubernetes deployment** - Helm charts for container orchestration
- **Monitoring and alerting** - Prometheus + Grafana + Alertmanager
- **Log aggregation** - ELK stack (Elasticsearch, Logstash, Kibana)
- **Distributed tracing** - Jaeger or OpenTelemetry for request tracing
- **Backup automation** - Automated MongoDB backups to S3

### Testing
- **Unit tests** - Jest for business logic and utilities
- **Integration tests** - Supertest for API endpoints
- **E2E tests** - Playwright for critical user flows
- **Load testing** - k6 or Artillery for performance testing
- **Socket.io testing** - Test real-time event flows

### Code Quality
- **Code coverage** - Target 80%+ coverage
- **API documentation** - OpenAPI/Swagger specification
- **Type safety** - Stricter TypeScript configuration
- **Code splitting** - Dynamic imports for better bundle size
- **Error tracking** - Sentry integration for production error monitoring

### Scalability
- **Microservices** - Split monolith into order, payment, notification services
- **Message queue** - RabbitMQ or AWS SQS for async processing
- **Event sourcing** - CQRS pattern for order state management
- **GraphQL API** - Alternative to REST for flexible queries
- **Serverless functions** - AWS Lambda for background jobs

### Mobile
- **React Native app** - Native mobile experience
- **Progressive Web App** - Offline support and app-like experience
- **Mobile push notifications** - FCM for iOS and Android

---

## 🎥 Demo Video

**Watch the full walkthrough:** [https://youtu.be/L9I2a-Co1RU](https://youtu.be/L9I2a-Co1RU)

The demo video covers:
- Complete system architecture overview
- Customer flow: browsing, ordering, and live tracking
- Delivery partner flow: accepting orders and updating status
- Admin dashboard: monitoring and management
- Real-time WebSocket communication in action
- Deployment process and infrastructure setup

---

## 📝 Assignment Deliverables Checklist

✅ **GitHub Repository:** [https://github.com/adithya-parambil/eeshuu](https://github.com/adithya-parambil/eeshuu)  
✅ **Frontend Live URL:** [https://eeshuu.qzz.io](https://eeshuu.qzz.io)  
✅ **Backend API URL:** [https://eeshuu.qzz.io/api/v1](https://eeshuu.qzz.io/api/v1)  
✅ **WebSocket URL:** `wss://eeshuu.qzz.io/socket.io`  
✅ **Database:** MongoDB 7 (self-hosted in Docker)  
✅ **README.md:** Complete setup instructions and documentation  
✅ **Demo Video:** [YouTube walkthrough](https://youtu.be/L9I2a-Co1RU)

### Core Requirements Met

✅ **Customer Panel**
- Register/Login with JWT authentication
- Browse product catalog with categories
- Add items to cart
- Place orders with idempotency
- Live order status tracking
- Real-time delivery partner location on map

✅ **Delivery Partner Panel**
- Register/Login with role-based access
- View unassigned orders in real-time
- Accept orders with atomic lock mechanism
- Update delivery status (Picked Up → On the Way → Delivered)
- GPS location broadcasting
- Earnings and commission tracking

✅ **Admin Panel**
- View all orders with filtering
- View all users (customers and delivery partners)
- Live activity feed with real-time updates
- System statistics dashboard
- Product management
- Dispute management

✅ **Backend APIs**
- Auth APIs: Register, Login, Refresh, Logout (JWT)
- Customer APIs: Place order, view orders, cancel order
- Delivery APIs: Accept order, update status, view earnings
- Admin APIs: View all orders, users, system stats
- Health Check APIs: `/health/live`, `/health/ready`

✅ **Docker & Deployment**
- Dockerfile for frontend (Next.js standalone)
- Dockerfile for backend (Node.js + Express)
- docker-compose.yml orchestrating all services
- Self-hosted on AWS EC2 (not Vercel/Netlify)
- Nginx reverse proxy with SSL
- Health monitoring and auto-restart

✅ **Real-Time Communication**
- Socket.io for bidirectional communication
- Order status updates broadcast to all parties
- Atomic order locking (first delivery partner wins)
- Live GPS tracking with Redis caching
- Reconnection handling

---

## 🤝 Contributing

This project was built for the Beeyond Tech assignment. Contributions, issues, and feature requests are welcome!

---

## 📄 License

[MIT](LICENSE) — Built with ☕ and Socket.io by [Adithya Jayakumar Parambil](https://github.com/adithya-parambil)

---

## 🙏 Acknowledgments

- **Beeyond Tech** - For the comprehensive full-stack assignment
- **Next.js Team** - For the amazing React framework
- **Socket.io Team** - For real-time communication made easy
- **MongoDB** - For the flexible document database
- **Docker** - For containerization and deployment simplicity

---

<div align="center">

**Built for Beeyond Tech Full-Stack + DevOps Assignment**

Made with ❤️ by Adithya Jayakumar Parambil

[Live Demo](https://eeshuu.qzz.io) • [Demo Video](https://youtu.be/L9I2a-Co1RU) • [GitHub](https://github.com/adithya-parambil/eeshuu)

</div>