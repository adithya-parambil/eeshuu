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

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## Overview

Eeshuu is a production-grade quick commerce platform with end-to-end real-time order tracking, live delivery partner GPS, and role-based dashboards — all running in Docker on a single VM behind Nginx.

Three roles, one system:

| Role | Capability |
|---|---|
| 🛒 **Customer** | Browse catalog, place orders, track live delivery on an interactive map |
| 🛵 **Delivery Partner** | Receive instant order notifications, accept via atomic lock, update status in real time |
| 🖥️ **Admin** | Monitor all orders, users, and live system activity from a unified dashboard |

---

## Architecture

```
                    ┌──────────────────────────────────────┐
                    │         Cloud VM (EC2 / GCP / DO)    │
                    │                                      │
                    │  ┌───────────────────────────────┐  │
                    │  │         Nginx  :80             │  │
                    │  │                               │  │
                    │  │  /          → frontend :3000  │  │
                    │  │  /api/       → backend  :5000 │  │
                    │  │  /socket.io/ → backend  :5000 │  │
                    │  │  /health/    → backend  :5000 │  │
                    │  └──────┬──────────────┬──────────┘  │
                    │         │              │              │
                    │  ┌──────▼──────┐ ┌────▼──────────┐  │
                    │  │  Frontend   │ │    Backend     │  │
                    │  │  Next.js 14 │ │  Express.js    │  │
                    │  │   :3000     │ │  + Socket.io   │  │
                    │  └─────────────┘ │    :5000       │  │
                    │                  └────┬───────────┘  │
                    │                       │              │
                    │               ┌───────▼──────┐       │
                    │               │  MongoDB 7   │       │
                    │               │  (Docker)    │       │
                    │               │   :27017     │       │
                    │               └──────────────┘       │
                    │                                      │
                    │               ┌──────────────┐       │
                    │               │  Redis       │       │
                    │               │  (optional)  │       │
                    │               │  Socket.io   │       │
                    │               │  adapter     │       │
                    │               └──────────────┘       │
                    └──────────────────────────────────────┘

Browser / Mobile
  ├── HTTP  →  http://<VM_IP>/api/v1/*    (REST)
  └── WS    →  ws://<VM_IP>/socket.io/   (Socket.io)
```

---

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand |
| **Backend** | Node.js, Express.js, TypeScript |
| **Real-Time** | Socket.io 4 |
| **Database** | MongoDB 7 (Docker container) |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Reverse Proxy** | Nginx (Alpine) |
| **Containerization** | Docker, Docker Compose |
| **Logging** | Pino (structured JSON) |
| **Validation** | Zod |
| **Maps** | Leaflet + OpenStreetMap (CartoDB dark tiles) |

---

## Project Structure

```
eeshuu/
├── app/                          # Next.js 14 App Router pages
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (app)/
│       ├── dashboard/page.tsx    # Customer product catalog
│       ├── orders/               # Customer order list + detail
│       ├── delivery/
│       │   ├── orders/           # Available orders feed
│       │   ├── active/           # Active delivery + GPS
│       │   ├── history/          # Completed deliveries
│       │   └── earnings/         # Commission stats
│       ├── admin/
│       │   ├── dashboard/        # Live stats + feed
│       │   ├── orders/           # All orders table
│       │   ├── users/            # User management
│       │   ├── products/         # Product management
│       │   └── disputes/         # Dispute management
│       ├── wallet/               # Delivery partner wallet
│       └── disputes/             # Customer disputes
│
├── backend/
│   └── src/
│       ├── config/               # Env validation, module configs
│       ├── middleware/           # Auth, validation, rate limit, idempotency
│       ├── modules/              # Route + controller per feature
│       │   ├── auth/
│       │   ├── order/
│       │   ├── product/
│       │   ├── admin/
│       │   ├── wallet/
│       │   ├── payment/
│       │   ├── dispute/
│       │   ├── rating/
│       │   ├── user/
│       │   └── health/
│       ├── repositories/         # CQRS read/write repos + Mongoose models
│       ├── services/             # Business logic (order state machine, pricing)
│       ├── socket/               # Socket.io engine, namespaces, events
│       ├── use-cases/            # Application use cases
│       └── utils/                # Logger, cache, blacklist, token utils
│
├── components/                   # React component library
│   ├── atoms/                    # Button, Badge, Spinner
│   ├── molecules/                # OrderCard, DeliveryMap, ProductCard
│   ├── organisms/                # OrderTable
│   └── layout/                   # AppShell, NavSidebar, MobileNav
│
├── hooks/                        # useOrderSocket, useAdminSocket
├── lib/                          # API clients, socket client, geocoding
├── store/                        # Zustand stores (auth, customer, delivery)
├── types/                        # Shared TypeScript types
│
├── nginx/
│   ├── nginx.conf                # Main reverse proxy config
│   └── nginx.ssl.conf.example    # SSL template
│
├── docker-compose.yml
├── Dockerfile                    # Frontend
├── .env.example
└── Makefile
```

---

## Quick Start

### Prerequisites

- Git
- Docker 24+ and Docker Compose 2.20+
- An SSH key pair for your VM

---

### 1 · SSH into your server

```bash
# AWS EC2
ssh -i ~/.ssh/your-key.pem ubuntu@<EC2_PUBLIC_IP>

# GCP
ssh -i ~/.ssh/your-key <USERNAME>@<GCP_EXTERNAL_IP>

# DigitalOcean
ssh root@<DROPLET_IP>

# Azure
ssh -i ~/.ssh/your-key azureuser@<AZURE_PUBLIC_IP>
```

### 2 · Install Docker

```bash
sudo apt-get update
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
sudo apt-get install -y docker-compose-plugin

# Verify
docker --version && docker compose version
```

### 3 · Clone the repository

```bash
git clone https://github.com/<your-username>/eeshuu.git
cd eeshuu
```

### 4 · Configure environment variables

```bash
cp .env.example .env
nano .env
```

Set the required values:

```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<strong_password>

# Generate with: openssl rand -hex 64
JWT_ACCESS_SECRET=<64_char_secret>
JWT_REFRESH_SECRET=<64_char_secret>

CLIENT_URL=http://<VM_PUBLIC_IP>
NEXT_PUBLIC_API_URL=http://<VM_PUBLIC_IP>/api
NEXT_PUBLIC_SOCKET_URL=http://<VM_PUBLIC_IP>
```

Generate secrets in one shot:

```bash
echo "JWT_ACCESS_SECRET=$(openssl rand -hex 64)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)"
```

### 5 · Build and start all services

```bash
docker compose up --build -d
```

This brings up four containers:

| Container | Description |
|---|---|
| `mongodb` | MongoDB 7 with auth, data persisted in a Docker volume |
| `backend` | Express + Socket.io API on internal port 5000 |
| `frontend` | Next.js 14 standalone on internal port 3000 |
| `nginx` | Reverse proxy — the **only** exposed port (`:80`) |

Verify all containers are healthy:

```bash
docker compose ps
```

```
NAME        STATUS          PORTS
mongodb     Up (healthy)
backend     Up (healthy)
frontend    Up
nginx       Up              0.0.0.0:80->80/tcp
```

### 6 · Seed demo data

```bash
docker compose exec backend node dist/scripts/seed-demo-data.js
```

### 7 · Verify the deployment

```bash
curl http://<VM_PUBLIC_IP>/health/live    # → { "status": "ok" }
curl http://<VM_PUBLIC_IP>/health/ready   # → { "status": "ready", ... }
curl http://<VM_PUBLIC_IP>/api/v1/products
```

Then open `http://<VM_PUBLIC_IP>` in your browser.

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

## WebSocket Events

Two namespaces: `/order` and `/admin`. All connections require a valid JWT in the handshake:

```javascript
const socket = io('http://<host>/order', {
  auth: { token: localStorage.getItem('access_token') }
})
```

### Room Architecture

```
delivery:pool          All online delivery partners
user:{userId}          Personal room per user
order:{orderId}        All parties tracking a specific order
admin:dashboard        All admin sockets
```

### Full Order Lifecycle

```
1. Customer places order (REST)
   └─► v1:ORDER:NEW  →  delivery:pool, admin:dashboard

2. Delivery partner emits v1:ORDER:ACCEPT
   └─► Atomic DB lock (first-come wins)
       ├─► v1:ORDER:ACCEPTED  →  user:{customerId}, order:{orderId}, admin:dashboard
       ├─► Partner joins  order:{orderId}
       └─► Partner leaves delivery:pool

3. Partner emits v1:ORDER:UPDATE_STATUS  (PICKED_UP / ON_THE_WAY / DELIVERED)
   └─► State machine validation
       └─► v1:ORDER:STATUS_UPDATED  →  order:{orderId}, user:{customerId}, admin:dashboard
       └─► On DELIVERED: commission credited to wallet

4. Partner emits v1:PARTNER:LOCATION  (GPS every ~3s)
   └─► Written to Redis (no DB write)
       └─► v1:ORDER:LOCATION_UPDATED  →  order:{orderId}, admin:dashboard

5. Customer cancels order (REST)
   └─► v1:ORDER:CANCELLED  →  order:{orderId}, user:{customerId}, user:{partnerId}, admin:dashboard

6. Partner disconnects
   └─► v1:PARTNER:OFFLINE  →  admin:dashboard, order:{activeOrderRoom}
       (customers see "LAST KNOWN" badge on map)
```

### Reconnect Behaviour

On reconnect, the client automatically refetches available and active orders from the REST API, re-joins the order room via `join:order`, and resumes live location updates — no state is lost on brief disconnects.

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

## Scaling

### Enabling Redis

Socket.io currently runs in single-instance mode. To scale horizontally, enable the Redis adapter:

**Step 1 — Uncomment Redis in `docker-compose.yml`:**

```yaml
redis:
  image: redis:7-alpine
  container_name: redis
  restart: unless-stopped
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redis-data:/data
  networks:
    - app-network
```

**Step 2 — Set `REDIS_URL` in `.env`:**

```bash
REDIS_URL=redis://redis:6379
```

**Step 3 — No code changes needed.** The backend auto-detects `REDIS_URL` and activates the adapter. Redis also enables persistent token blacklist and response cache across restarts.

### Horizontal Scaling

```
                ┌───────────────────────┐
  Browser ───►  │     Load Balancer     │
                │  (ALB / Nginx)        │
                │  sticky sessions: ON  │
                └────────┬──────┬───────┘
                         │      │
             ┌───────────▼─┐ ┌──▼──────────┐
             │  Backend #1 │ │  Backend #2  │
             │  Express +  │ │  Express +   │
             │  Socket.io  │ │  Socket.io   │
             └──────┬──────┘ └──────┬───────┘
                    │               │
                    └───────┬───────┘
                            │
                     ┌──────▼──────┐
                     │    Redis    │  ← Socket.io adapter + shared cache
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │   MongoDB   │  ← replica set
                     └─────────────┘
```

**Key requirements:**

- **Sticky sessions** — Socket.io polling transport requires the same client to hit the same instance during handshake (`ip_hash` in Nginx or AWS ALB stickiness)
- **Redis adapter** — fans out all Socket.io events across instances automatically
- **MongoDB replica set** — the connection string already supports replica set URIs

```bash
# Scale backend instances on a single VM
docker compose up --scale backend=3 -d
```

---

## Health Monitoring

```bash
# Liveness — is the process alive?
curl http://<host>/health/live
# → { "status": "ok", "uptime": 123.4 }

# Readiness — is MongoDB reachable?
curl http://<host>/health/ready
# → { "status": "ready", "checks": [{ "name": "mongodb", "status": "pass", "latencyMs": 2 }] }
```

The backend `Dockerfile` includes a `HEALTHCHECK` directive — Docker monitors and auto-restarts the container if the liveness probe fails 3 consecutive times.

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

## Future Improvements

- **HTTPS / SSL** — Let's Encrypt via Certbot (`nginx/nginx.ssl.conf.example` already included)
- **Push Notifications** — Web Push API or Firebase FCM for background order updates
- **Atomic stock decrement** — MongoDB `findOneAndUpdate` with `$inc` for race-safe stock management
- **Edge route protection** — Move role-based guards from `app-shell.tsx` to Next.js `middleware.ts`
- **Test suite** — Unit tests for the order state machine; integration tests for the full order flow
- **Kubernetes** — Helm chart for production orchestration, auto-scaling, and rolling deploys
- **CI/CD** — GitHub Actions: lint → test → build → push to ECR → deploy via SSH
- **Monitoring** — Wire Prometheus metrics to Grafana + Alertmanager for latency and error alerts
- **Payment webhooks** — Replace Razorpay mock with real webhook verification

---

## License

[MIT](LICENSE) — built with ☕ and Socket.io