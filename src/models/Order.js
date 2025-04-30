// src/models/Order.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const orderProductSchema = new Schema({
  productId: String,   // string reference to Product._id
  quantity: Number,
  priceAtPurchase: Number,
}, { _id: false });

const orderSchema = new Schema({
  _id: String,           // now a string
  customerId: String,    // string reference to Customer._id
  products: [orderProductSchema],
  totalAmount: Number,
  orderDate: Date,
  status: String,
}, {
  timestamps: true
});

module.exports = model('Order', orderSchema);
