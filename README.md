# Sales Analytics GraphQL API

This document provides end-to-end documentation for the Sales Analytics GraphQL API, covering setup, seeding, schema, queries, and testing.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Environment Configuration](#environment-configuration)
5. [Project Structure](#project-structure)
6. [Models](#models)
7. [GraphQL Schema & Resolvers](#graphql-schema--resolvers)
8. [Seeding the Database](#seeding-the-database)
9. [Running the Server](#running-the-server)
10. [Example Queries](#example-queries)
11. [Cleaning & Re-seeding](#cleaning--re-seeding)

---

## Overview

This Node.js application exposes a GraphQL API to analyze sales data stored in MongoDB. Key capabilities:

- **Customer Spending**: Total spent, average order value, last order date per customer
- **Top Selling Products**: Ranking by quantity sold
- **Sales Analytics**: Total revenue, completed orders count, category revenue breakdown for a date range

---

## Prerequisites

- **Node.js** v14+
- **MongoDB** v4+
- **npm** (comes with Node.js)

---

## Installation

1. Clone the repo
   ```bash
   git clone <repo-url> sales-analytics-api
   cd sales-analytics-api
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Copy CSV data into `data/`:
   - `customers.csv`
   - `products.csv`
   - `orders.csv`

---

## Environment Configuration

Create a `.env` file in project root:

```dotenv
MONGO_URI=mongodb://localhost:27017/salesAnalytics
PORT=4000
```

- **MONGO_URI**: MongoDB connection string
- **PORT**: HTTP port for GraphQL server

---

## Project Structure

```text
sales-analytics-api/
├── .env
├── data/
│   ├── customers.csv
│   ├── products.csv
│   └── orders.csv
├── package.json
├── src/
│   ├── index.js          # Server bootstrap
│   ├── schema.js         # GraphQL typeDefs & resolvers
│   ├── seed.js           # CSV ➔ MongoDB import script
│   └── models/
│       ├── Customer.js   # Mongoose model (string _id)
│       ├── Product.js    # Mongoose model (string _id)
│       └── Order.js      # Mongoose model (string _id)
└── README.md             # Documentation
```

---

## Models

All `_id` fields and references use **String** (UUIDs). Schemas:

- **Customer**: `{ _id: String, name, email, age, location, gender }`
- **Product**:  `{ _id: String, name, category, price, stock }`
- **Order**:    `{ _id: String, customerId: String, products: [{ productId: String, quantity, priceAtPurchase }], totalAmount, orderDate, status }`

Refer to `src/models/*.js` for full definitions.

---

## GraphQL Schema & Resolvers

See `src/schema.js`. Highlights:

```graphql
type CustomerSpending {
  customerId: ID!
  totalSpent: Float!
  averageOrderValue: Float!
  lastOrderDate: String
}

type TopProduct {
  productId: ID!
  name: String!
  totalSold: Int!
}

type CategoryRevenue {
  category: String!
  revenue: Float!
}

type SalesAnalytics {
  totalRevenue: Float!
  completedOrders: Int!
  categoryBreakdown: [CategoryRevenue!]!
}

type Query {
  getCustomerSpending(customerId: ID!): CustomerSpending
  getTopSellingProducts(limit: Int!): [TopProduct!]!
  getSalesAnalytics(startDate: String!, endDate: String!): SalesAnalytics!
}
```

Resolvers use MongoDB aggregations to calculate sums, averages, and group-by operations.

---

## Seeding the Database

1. Ensure MongoDB is running.
2. Run the seed script:
   ```bash
   node src/seed.js
   ```
3. You should see:
   ```
   ✅ Database seeded!
   ```

This clears existing collections and imports CSV data. The script transforms Python-style lists by replacing single quotes with double quotes before parsing.

---

## Running the Server

Start the GraphQL server:

```bash
node src/index.js
```

Output:

```
▶️ Connected to MongoDB
🚀 Server ready: http://localhost:4000/graphql
```

---

## Example Queries

### 1. Customer Spending

```graphql
query {
  getCustomerSpending(customerId: "<CUSTOMER_ID>") {
    customerId
    totalSpent
    averageOrderValue
    lastOrderDate
  }
}
```

### 2. Top Selling Products

```graphql
query {
  getTopSellingProducts(limit: 3) {
    productId
    name
    totalSold
  }
}
```

### 3. Sales Analytics

```graphql
query {
  getSalesAnalytics(startDate: "2024-01-01", endDate: "2024-12-31") {
    totalRevenue
    completedOrders
    categoryBreakdown {
      category
      revenue
    }
  }
}
```

---

## Cleaning & Re-seeding

### Drop Database + Seed (one-liner)

```bash
mongo salesAnalytics --eval "db.dropDatabase()" \
  && node src/seed.js
```

### Programmatic Clean & Seed

Create `cleanSeed.js`:

```js
require('dotenv').config();
const mongoose = require('mongoose');
const seed = require('./seed');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
  console.log('🗑️ Database dropped');
  await seed();
})();
```

Run:

```bash
node cleanSeed.js
```

---

