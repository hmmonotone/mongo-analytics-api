require('dotenv').config();
const mongoose = require('mongoose');
const csv      = require('csvtojson');
const Customer = require('./models/Customer');
const Product  = require('./models/Product');
const Order    = require('./models/Order');

async function seed() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);

  // Clear existing data
  await Promise.all([
    Customer.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({})
  ]);

  // Import customers from CSV
  const customers = await csv().fromFile('data/customers.csv');
  for (let c of customers) {
    await Customer.create({
      _id: c._id,
      name: c.name,
      email: c.email,
      age: +c.age,
      location: c.location,
      gender: c.gender
    });
  }

  // Import products from CSV
  const products = await csv().fromFile('data/products.csv');
  for (let p of products) {
    await Product.create({
      _id: p._id,
      name: p.name,
      category: p.category,
      price: +p.price,
      stock: +p.stock
    });
  }

  // Import orders from CSV (transform Python-style list to valid JSON)
  const orders = await csv().fromFile('data/orders.csv');
  for (let o of orders) {
    const raw   = o.products.replace(/'/g, '"');
    const items = JSON.parse(raw);
    await Order.create({
      _id: o._id,
      customerId: o.customerId,
      products: items.map(i => ({
        productId: i.productId,
        quantity: +i.quantity,
        priceAtPurchase: +i.priceAtPurchase
      })),
      totalAmount: +o.totalAmount,
      orderDate:   new Date(o.orderDate),
      status:      o.status
    });
  }

  console.log('✅ Database seeded!');
  process.exit(0);
}

seed();
