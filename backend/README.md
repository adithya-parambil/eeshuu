# E-Commerce Backend - Production-Grade Node.js/Express API

A **security-first, enterprise-ready** backend built with **clean architecture**, **CQRS pattern**, and **real-time Socket.io integration**.

## 📋 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration & environment
│   │   ├── env.ts          # Environment variables validation
│   │   └── modules/        # Modular config (JWT, DB, Redis, etc.)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Shared utilities (logger, errors, helpers)
│   ├── repositories/       # Data access layer (CQRS read/write)
│   │   ├── models/         # Mongoose schemas
│   │   ├── read/           # Read repositories (queries)
│   │   └── write/          # Write repositories (commands)
│   ├── services/           # Business logic layer
│   ├── use-cases/          # Application use-cases
│   │   ├── auth/
│   │   ├── order/
│   │   ├── product/
│   │   └── admin/
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── role.guard.ts
│   │   ├── rate-limiter.ts
│   │   ├── idempotency.middleware.ts
│   │   └── error-handler.ts
│   ├── modules/            # Feature modules (controllers + routes)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── order/
│   │   ├── product/
│   │   ├── admin/
│   │   └── health/
│   ├── socket/             # Real-time Socket.io layer
│   │   ├── events/         # Event catalog & types
│   │   ├── namespaces/     # Isolated socket namespaces
│   │   ├── middleware/     # Socket-specific middleware
│   │   ├── adapters/       # Redis adapter for scaling
│   │   └── socket.engine.ts
│   ├── app.ts             # Express app initialization
│   ├── server.ts          # Server bootstrap & startup
│   └── index.ts           # Barrel exports
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── .env.development
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Redis instance
- pnpm or npm

### Installation

```bash
cd backend
pnpm install
```

### Configuration

1. Copy `.env.example` to `.env.development`:
```bash
cp .env.example .env.development
```

2. Update environment variables:
```env
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

### Running the Server

```bash
# Development (with hot reload)
pnpm dev

# Production
pnpm build
pnpm start

# Run tests
pnpm test

# Watch tests
pnpm test:watch
```

## 📊 Architecture

### Three-Phase Implementation

#### **Phase 1: REST API Foundation**
- Express HTTP server with clean architecture
- CQRS pattern for data access (read/write separation)
- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting & idempotency
- Comprehensive error handling

#### **Phase 2: Enterprise Features**
- Request validation with Zod schemas
- Token blacklist for logout
- Redis caching layer
- Metrics & observability
- Health checks & readiness probes
- Structured logging (JSON format)

#### **Phase 3: Real-Time Communication**
- Socket.io with namespace isolation
- Redis adapter for horizontal scaling
- Event-driven architecture with type-safe catalogs
- Room-based broadcasting
- User presence tracking
- Admin dashboard updates

## 🔐 Security Features

✅ **Helmet.js** - Sets secure HTTP headers  
✅ **CORS** - Whitelist-based origin control  
✅ **JWT Auth** - Stateless authentication  
✅ **Rate Limiting** - Per-endpoint & global limits  
✅ **Input Validation** - Zod schema validation  
✅ **Token Blacklist** - Revoke tokens on logout  
✅ **Password Hashing** - bcrypt with salt rounds  
✅ **HTTPS Ready** - TLS/SSL support  
✅ **SQL Injection Prevention** - Parameterized queries  
✅ **XSS Protection** - Content-type enforcement  

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create new user
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout & revoke token

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Orders
- `POST /api/v1/orders` - Place new order (idempotent)
- `GET /api/v1/orders` - List user's orders
- `GET /api/v1/orders/:orderId` - Get order details
- `POST /api/v1/orders/:orderId/accept` - Accept order (seller)
- `PUT /api/v1/orders/:orderId/status` - Update order status
- `POST /api/v1/orders/:orderId/cancel` - Cancel order

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/:productId` - Get product details
- `POST /api/v1/products` - Create product (authenticated)

### Admin
- `GET /api/v1/admin/stats` - System statistics
- `GET /api/v1/admin/orders` - List all orders

### Health
- `GET /api/v1/health/ping` - Server health check
- `GET /api/v1/health/readiness` - Readiness probe
- `GET /api/v1/health/metrics` - Prometheus metrics

## 🔌 Socket.io Events

### Order Namespace (`/orders`)
- `subscribe:order` - Subscribe to order updates
- `order:placed` - New order placed
- `order:accepted` - Order accepted by seller
- `order:status_changed` - Order status updated
- `order:cancelled` - Order cancelled
- `order:delivered` - Order delivered

### Notifications Namespace (`/notifications`)
- `notification:new` - New notification
- `notification:read` - Mark as read
- `notifications:clear` - Clear all notifications

### Admin Namespace (`/admin`)
- `admin:system_alert` - System alert
- `admin:dashboard_update` - Dashboard data update
- `request:metrics` - Request live metrics
- `request:dashboard` - Request dashboard data

## 🏗️ Design Patterns

### CQRS (Command Query Responsibility Segregation)
- **Write Repositories**: Handle data mutations
- **Read Repositories**: Handle queries with caching
- Separated concerns for scalability

### Use-Case Driven
- Each feature has dedicated use-case classes
- Business logic isolated from HTTP concerns
- Testable and reusable

### Middleware Pipeline
- Request ID injection
- Authentication & Authorization
- Validation
- Rate limiting
- Error handling

### Event-Driven Architecture
- Type-safe Socket.io events
- Room-based broadcasting
- Centralized event catalog

## 📝 Logging

Structured JSON logging with context:
```json
{
  "level": "info",
  "timestamp": "2024-01-15T10:30:45Z",
  "service": "OrderService",
  "message": "Order placed successfully",
  "orderId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "amount": 299.99
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/use-cases/auth/login.use-case.spec.ts

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## 🚀 Deployment

### Environment-Specific Configs
```bash
# Development
.env.development

# Production
.env.production
```

### Horizontal Scaling
The backend scales horizontally with:
- Redis adapter for Socket.io
- Session storage in Redis
- Stateless JWT authentication
- Database connection pooling

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 📚 Key Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **redis** - Caching & sessions
- **socket.io** - Real-time communication
- **jsonwebtoken** - JWT auth
- **bcrypt** - Password hashing
- **zod** - Schema validation
- **helmet** - Security headers
- **pino** - JSON logging

## 🤝 Contributing

Follow the established patterns:
1. Keep the layered architecture clean
2. Add use-cases for new features
3. Validate inputs with Zod schemas
4. Use structured logging
5. Write tests for business logic
6. Handle errors gracefully

## 📄 License

MIT

---

**Built with ❤️ for production-grade applications**
