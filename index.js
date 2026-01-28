require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const client = new MongoClient(MONGO_URI);
let productsCollection;

// ===== CONNECT DB =====
async function connectDB() {
  try {
    await client.connect();
    const db = client.db('shop');
    productsCollection = db.collection('products');
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB();

// ===== ROOT =====
app.get('/', (req, res) => {
  res.json({ message: 'Practice Task 11 API is running' });
});

// ===== VERSION (Practice Task 12) =====
app.get('/version', (req, res) => {
  res.json({
    version: '1.1.0',
    task: 'Practice Task 12',
    status: 'updated'
  });
});

// ===== GET ALL =====
app.get('/api/products', async (req, res) => {
  try {
    const products = await productsCollection.find().toArray();
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== GET BY ID =====
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== POST =====
app.post('/api/products', async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await productsCollection.insertOne({ name, price, category });
    res.status(201).json({ id: result.insertedId });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== PUT =====
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, category } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, price, category } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== DELETE =====
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
