// src/models/Product.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const productSchema = new Schema({
  _id: String,           // now a string
  name: String,
  category: String,
  price: Number,
  stock: Number,
}, {
  timestamps: true
});

module.exports = model('Product', productSchema);
