require('dotenv').config();
const express       = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose      = require('mongoose');
const { typeDefs, resolvers } = require('./schema');

async function start() {
  const app    = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('▶️ Connected to MongoDB');

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(`🚀 Server ready: http://localhost:${PORT}/graphql`)
  );
}

start();
