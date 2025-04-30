const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const customerSchema = new Schema({
  _id: String,            // now a string
  name: String,
  email: String,
  age: Number,
  location: String,
  gender: String,
}, {
  timestamps: true
});

module.exports = model('Customer', customerSchema);
