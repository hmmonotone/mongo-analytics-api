const { gql } = require('apollo-server-express');
const Customer = require('./models/Customer');
const Product  = require('./models/Product');
const Order    = require('./models/Order');

const typeDefs = gql`
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
`;

const resolvers = {
  Query: {
    getCustomerSpending: async (_, { customerId }) => {
      const [grp] = await Order.aggregate([
        { $match: { customerId, status: 'completed' } },
        { $group: {
            _id: '$customerId',
            totalSpent:       { $sum: '$totalAmount' },
            averageOrderValue:{ $avg: '$totalAmount' },
            lastOrderDate:    { $max: '$orderDate' }
        } }
      ]);
      if (!grp) {
        return {
          customerId,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: null
        };
      }
      return {
        customerId,
        totalSpent: grp.totalSpent,
        averageOrderValue: grp.averageOrderValue,
        lastOrderDate: grp.lastOrderDate.toISOString()
      };
    },

    getTopSellingProducts: async (_, { limit }) => {
      const results = await Order.aggregate([
        { $unwind: '$products' },
        { $group: {
            _id: '$products.productId',
            totalSold: { $sum: '$products.quantity' }
        } },
        { $sort: { totalSold: -1 } },
        { $limit: limit },
        { $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'prod'
        } },
        { $unwind: '$prod' },
        { $project: {
            productId: '$_id',
            name: '$prod.name',
            totalSold: 1
        } }
      ]);
      return results.map(r => ({
        productId: r.productId,
        name: r.name,
        totalSold: r.totalSold
      }));
    },

    getSalesAnalytics: async (_, { startDate, endDate }) => {
      const start = new Date(startDate);
      const end   = new Date(endDate);
      end.setHours(23,59,59,999);

      const [tot] = await Order.aggregate([
        { $match: { orderDate: { $gte: start, $lte: end }, status: 'completed' } },
        { $group: {
            _id: null,
            totalRevenue:    { $sum: '$totalAmount' },
            completedOrders: { $sum: 1 }
        } }
      ]);

      const cat = await Order.aggregate([
        { $match: { orderDate: { $gte: start, $lte: end }, status: 'completed' } },
        { $unwind: '$products' },
        { $lookup: {
            from: 'products',
            localField: 'products.productId',
            foreignField: '_id',
            as: 'prod'
        } },
        { $unwind: '$prod' },
        { $group: {
            _id: '$prod.category',
            revenue: { $sum: { $multiply: ['$products.quantity', '$products.priceAtPurchase'] } }
        } },
        { $project: { category: '$_id', revenue: 1, _id: 0 } }
      ]);

      return {
        totalRevenue:    tot?.totalRevenue || 0,
        completedOrders: tot?.completedOrders || 0,
        categoryBreakdown: cat.map(c => ({ category: c.category, revenue: c.revenue }))
      };
    }
  }
};

module.exports = { typeDefs, resolvers };
