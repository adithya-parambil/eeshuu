/**
 * Demo Data Seeder for Eeshuu
 * Run: npm run seed
 */

import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { config } from 'dotenv'
import path from 'path'

// Try to load .env.development, fallback to production env vars if not found
const envPath = path.join(__dirname, '../.env.development')
config({ path: envPath })

import { UserModel } from '../src/repositories/models/user.model'
import { ProductModel } from '../src/repositories/models/product.model'
import { OrderModel } from '../src/repositories/models/order.model'

const DEMO_PASSWORD = 'Demo@1234'

const demoUsers = [
  { name: 'Demo Customer',        email: 'customer@demo.com', role: 'customer', phone: '+1234567890' },
  { name: 'Demo Delivery Partner',email: 'delivery@demo.com', role: 'delivery', phone: '+1234567891' },
  { name: 'Demo Admin',           email: 'admin@demo.com',    role: 'admin',    phone: '+1234567892' },
]

const products = [
  // ── Dairy ──────────────────────────────────────────────────────────────────
  { name: 'Fresh Milk (1L)',         category: 'Dairy',      price: 68,   stock: 100, description: 'Farm-fresh full-cream milk', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Organic Eggs (12)',       category: 'Dairy',      price: 120,  stock: 80,  description: 'Free-range organic eggs', imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400' },
  { name: 'Amul Butter (500g)',      category: 'Dairy',      price: 275,  stock: 60,  description: 'Pasteurised salted butter', imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400' },
  { name: 'Amul Cheese (200g)',      category: 'Dairy',      price: 130,  stock: 55,  description: 'Processed cheddar cheese slices', imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400' },
  { name: 'Greek Yogurt (400g)',     category: 'Dairy',      price: 90,   stock: 70,  description: 'Thick creamy Greek yogurt', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400' },
  { name: 'Paneer (200g)',           category: 'Dairy',      price: 95,   stock: 65,  description: 'Fresh homestyle cottage cheese', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400' },
  { name: 'Lassi (500ml)',           category: 'Dairy',      price: 55,   stock: 80,  description: 'Sweet mango lassi', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400' },

  // ── Bakery ─────────────────────────────────────────────────────────────────
  { name: 'Whole Wheat Bread',       category: 'Bakery',     price: 45,   stock: 60,  description: 'Freshly baked whole wheat loaf', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
  { name: 'Multigrain Bread',        category: 'Bakery',     price: 55,   stock: 50,  description: 'Seeds & grains artisan loaf', imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400' },
  { name: 'Croissants (4 pcs)',      category: 'Bakery',     price: 120,  stock: 40,  description: 'Buttery flaky croissants', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { name: 'Pav (8 pcs)',             category: 'Bakery',     price: 30,   stock: 90,  description: 'Soft dinner rolls', imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=400' },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  { name: 'Bananas (1kg)',           category: 'Fruits',     price: 40,   stock: 120, description: 'Ripe yellow bananas', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
  { name: 'Red Apples (1kg)',        category: 'Fruits',     price: 180,  stock: 90,  description: 'Crisp Shimla red apples', imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400' },
  { name: 'Mangoes (1kg)',           category: 'Fruits',     price: 160,  stock: 70,  description: 'Sweet Alphonso mangoes', imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400' },
  { name: 'Watermelon (whole)',      category: 'Fruits',     price: 120,  stock: 30,  description: 'Seedless summer watermelon', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400' },
  { name: 'Grapes (500g)',           category: 'Fruits',     price: 90,   stock: 60,  description: 'Seedless green grapes', imageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400' },
  { name: 'Pomegranate (2 pcs)',     category: 'Fruits',     price: 110,  stock: 50,  description: 'Juicy ruby pomegranates', imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400' },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  { name: 'Fresh Tomatoes (500g)',   category: 'Vegetables', price: 30,   stock: 70,  description: 'Vine-ripened tomatoes', imageUrl: 'https://images.unsplash.com/photo-1546470427-227e9e3e0e4e?w=400' },
  { name: 'Carrots (1kg)',           category: 'Vegetables', price: 50,   stock: 85,  description: 'Fresh organic carrots', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Spinach (250g)',          category: 'Vegetables', price: 25,   stock: 60,  description: 'Baby spinach leaves', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400' },
  { name: 'Onions (1kg)',            category: 'Vegetables', price: 35,   stock: 100, description: 'Red onions', imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400' },
  { name: 'Potatoes (1kg)',          category: 'Vegetables', price: 30,   stock: 110, description: 'Fresh farm potatoes', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400' },
  { name: 'Capsicum (3 pcs)',        category: 'Vegetables', price: 45,   stock: 55,  description: 'Mixed colour bell peppers', imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400' },
  { name: 'Broccoli (500g)',         category: 'Vegetables', price: 80,   stock: 40,  description: 'Fresh green broccoli florets', imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400' },

  // ── Meat ───────────────────────────────────────────────────────────────────
  { name: 'Chicken Breast (500g)',   category: 'Meat',       price: 280,  stock: 50,  description: 'Boneless skinless chicken breast', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400' },
  { name: 'Mutton Keema (500g)',     category: 'Meat',       price: 420,  stock: 45,  description: 'Fresh minced mutton', imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400' },
  { name: 'Chicken Legs (1kg)',      category: 'Meat',       price: 220,  stock: 55,  description: 'Tender chicken drumsticks', imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400' },
  { name: 'Eggs (6 pcs)',            category: 'Meat',       price: 65,   stock: 90,  description: 'Farm-fresh brown eggs', imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400' },

  // ── Beverages ──────────────────────────────────────────────────────────────
  { name: 'Orange Juice (1L)',       category: 'Beverages',  price: 110,  stock: 65,  description: 'Freshly squeezed orange juice', imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400' },
  { name: 'Coca Cola (2L)',          category: 'Beverages',  price: 95,   stock: 100, description: 'Classic Coca-Cola bottle', imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400' },
  { name: 'Mineral Water (1L)',      category: 'Beverages',  price: 20,   stock: 200, description: 'Bisleri mineral water', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' },
  { name: 'Green Tea (25 bags)',     category: 'Beverages',  price: 120,  stock: 70,  description: 'Organic green tea bags', imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },
  { name: 'Cold Coffee (250ml)',     category: 'Beverages',  price: 75,   stock: 60,  description: 'Ready-to-drink cold brew', imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
  { name: 'Mango Juice (1L)',        category: 'Beverages',  price: 85,   stock: 80,  description: 'Tropicana mango juice', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400' },

  // ── Snacks ─────────────────────────────────────────────────────────────────
  { name: "Lays Chips (100g)",       category: 'Snacks',     price: 30,   stock: 75,  description: 'Classic salted potato chips', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400' },
  { name: 'Dairy Milk (40g)',        category: 'Snacks',     price: 40,   stock: 120, description: 'Cadbury Dairy Milk chocolate', imageUrl: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400' },
  { name: 'Kurkure (90g)',           category: 'Snacks',     price: 20,   stock: 100, description: 'Masala puffed corn snack', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400' },
  { name: 'Biscuits (200g)',         category: 'Snacks',     price: 35,   stock: 90,  description: 'Parle-G glucose biscuits', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' },
  { name: 'Namkeen Mix (200g)',      category: 'Snacks',     price: 55,   stock: 70,  description: 'Haldirams bhujia sev mix', imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400' },
  { name: 'Dark Chocolate (100g)',   category: 'Snacks',     price: 180,  stock: 50,  description: '70% cocoa dark chocolate bar', imageUrl: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400' },

  // ── Pantry ─────────────────────────────────────────────────────────────────
  { name: 'Pasta (500g)',            category: 'Pantry',     price: 85,   stock: 90,  description: 'Italian durum wheat pasta', imageUrl: 'https://images.unsplash.com/photo-1551462147-37cbd8c5d00b?w=400' },
  { name: 'Basmati Rice (2kg)',      category: 'Pantry',     price: 220,  stock: 60,  description: 'Long grain aged basmati rice', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Olive Oil (500ml)',       category: 'Pantry',     price: 650,  stock: 40,  description: 'Extra virgin olive oil', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
  { name: 'Toor Dal (1kg)',          category: 'Pantry',     price: 140,  stock: 80,  description: 'Split pigeon peas', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400' },
  { name: 'Atta (5kg)',              category: 'Pantry',     price: 280,  stock: 55,  description: 'Aashirvaad whole wheat flour', imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400' },
  { name: 'Mustard Oil (1L)',        category: 'Pantry',     price: 175,  stock: 50,  description: 'Cold-pressed mustard oil', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
  { name: 'Tomato Ketchup (500g)',   category: 'Pantry',     price: 95,   stock: 70,  description: "Heinz tomato ketchup", imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400' },

  // ── Frozen ─────────────────────────────────────────────────────────────────
  { name: 'Vanilla Ice Cream (1L)',  category: 'Frozen',     price: 175,  stock: 50,  description: 'Kwality Walls vanilla ice cream', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
  { name: 'Frozen Peas (500g)',      category: 'Frozen',     price: 65,   stock: 60,  description: 'Sweet garden peas', imageUrl: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400' },
  { name: 'Frozen Fries (500g)',     category: 'Frozen',     price: 120,  stock: 55,  description: 'McCain crinkle-cut fries', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },

  // ── Seafood ────────────────────────────────────────────────────────────────
  { name: 'Rohu Fish (500g)',        category: 'Seafood',    price: 200,  stock: 30,  description: 'Fresh cleaned Rohu fish', imageUrl: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=400' },
  { name: 'Prawns (250g)',           category: 'Seafood',    price: 320,  stock: 25,  description: 'Cleaned tiger prawns', imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400' },
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...\n')

    // Support both DB_URI (dev) and MONGO_URI (production)
    const dbUri = process.env.DB_URI || process.env.MONGO_URI
    if (!dbUri) {
      throw new Error('DB_URI or MONGO_URI environment variable is required')
    }
    console.log(`📡 Connecting to MongoDB...`)
    await mongoose.connect(dbUri)
    console.log('✅ Connected\n')

    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await Promise.all([
      UserModel.deleteMany({}),
      ProductModel.deleteMany({}),
      OrderModel.deleteMany({}),
    ])
    console.log('✅ Cleared\n')

    // Seed users — use passwordHash field + wallet balance
    console.log('👥 Creating demo users...')
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
    const createdUsers = await UserModel.insertMany(
      demoUsers.map((u) => ({
        ...u,
        passwordHash,
        isActive: true,
        walletBalance: u.role === 'customer' ? 5000 : u.role === 'delivery' ? 500 : 0,
      }))
    )
    createdUsers.forEach((u) => console.log(`   ✓ ${u.email} (${u.role})`))
    console.log()

    // Seed products — use imageUrl field
    console.log('📦 Creating products...')
    const createdProducts = await ProductModel.insertMany(
      products.map((p) => ({ ...p, isActive: true }))
    )
    console.log(`   ✓ ${createdProducts.length} products created\n`)

    // Seed orders — match exact schema fields
    console.log('🛒 Creating sample orders...')
    const customer = createdUsers.find((u) => u.role === 'customer')!
    const delivery = createdUsers.find((u) => u.role === 'delivery')!

    const statuses = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'] as const
    
    // Real addresses in Bengaluru that will geocode properly
    const realAddresses = [
      { line1: 'MG Road', city: 'Bengaluru', pincode: '560001' },
      { line1: 'Brigade Road', city: 'Bengaluru', pincode: '560001' },
      { line1: 'Indiranagar', city: 'Bengaluru', pincode: '560038' },
      { line1: 'Koramangala', city: 'Bengaluru', pincode: '560034' },
      { line1: 'Whitefield', city: 'Bengaluru', pincode: '560066' },
      { line1: 'Jayanagar', city: 'Bengaluru', pincode: '560041' },
    ]
    
    const sampleOrders = []

    for (let i = 0; i < 12; i++) {
      const shuffled = [...createdProducts].sort(() => 0.5 - Math.random())
      const picked = shuffled.slice(0, Math.floor(Math.random() * 3) + 1)

      const items = picked.map((p) => ({
        productId: p._id.toString(),
        name: p.name,
        price: p.price,
        quantity: Math.floor(Math.random() * 3) + 1,
      }))

      const subtotal = parseFloat(
        items.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)
      )
      const tax = parseFloat((subtotal * 0.05).toFixed(2))
      const deliveryFee = 25
      const platformFee = 5
      const totalAmount = parseFloat((subtotal + tax + deliveryFee + platformFee).toFixed(2))
      const pricing = { subtotal, tax, deliveryFee, platformFee, total: totalAmount }

      const status = statuses[i % statuses.length]
      const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)

      const statusHistory: { status: string; timestamp: Date; actorId: string; note?: string }[] = [
        { status: 'PENDING', timestamp: createdAt, actorId: customer._id.toString() },
      ]

      const order: Record<string, unknown> = {
        customerId: customer._id,
        deliveryPartnerId: null,
        items,
        totalAmount,
        pricing,
        status,
        statusHistory,
        deliveryAddress: realAddresses[i % realAddresses.length],
        lockedAt: null,
        createdAt,
      }

      // Only assign delivery partner to DELIVERED orders (not in-progress ones)
      // This prevents the delivery partner from being blocked on fresh seed
      if (status === 'DELIVERED') {
        order.deliveryPartnerId = delivery._id
        const acceptedAt = new Date(createdAt.getTime() + 5 * 60 * 1000)
        const pickedAt   = new Date(createdAt.getTime() + 15 * 60 * 1000)
        const onWayAt    = new Date(createdAt.getTime() + 20 * 60 * 1000)
        const deliveredAt = new Date(createdAt.getTime() + 35 * 60 * 1000)
        statusHistory.push(
          { status: 'ACCEPTED',   timestamp: acceptedAt,  actorId: delivery._id.toString() },
          { status: 'PICKED_UP',  timestamp: pickedAt,    actorId: delivery._id.toString() },
          { status: 'ON_THE_WAY', timestamp: onWayAt,     actorId: delivery._id.toString() },
          { status: 'DELIVERED',  timestamp: deliveredAt, actorId: delivery._id.toString() },
        )
      }

      if (status === 'CANCELLED') {
        const cancelledAt = new Date(createdAt.getTime() + 2 * 60 * 1000)
        statusHistory.push({ status: 'CANCELLED', timestamp: cancelledAt, actorId: customer._id.toString(), note: 'Customer requested cancellation' })
      }

      sampleOrders.push(order)
    }

    const createdOrders = await OrderModel.insertMany(sampleOrders)
    console.log(`   ✓ ${createdOrders.length} orders created\n`)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✨ Database seeded successfully!\n')
    console.log('📊 Summary:')
    console.log(`   Users:    ${createdUsers.length}`)
    console.log(`   Products: ${createdProducts.length}`)
    console.log(`   Orders:   ${createdOrders.length}\n`)
    console.log('🔐 Demo Credentials:')
    console.log('   customer@demo.com / Demo@1234')
    console.log('   delivery@demo.com / Demo@1234')
    console.log('   admin@demo.com    / Demo@1234')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

seedDatabase()
