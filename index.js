require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY;

function apiKeyMiddleware(req, res, next) {
  const clientKey = req.headers['x-api-key'];

  if (!clientKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (clientKey !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}


// ===== CONFIG =====
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ===== DB =====
const client = new MongoClient(MONGO_URI);
let itemsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('shop');
    itemsCollection = db.collection('items');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
connectDB();

// ===== AUTH MIDDLEWARE =====
function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// ===== ROOT =====
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// ===== VERSION (Practice Task 12) =====
app.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Practice Task API',
    status: 'stable'
  });
});

// ===== GET ALL ITEMS =====
app.get('/api/items', async (req, res) => {
  try {
    const items = await itemsCollection.find().toArray();
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== GET ITEM BY ID =====
app.get('/api/items/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== POST (PROTECTED) =====
app.post('/api/items', authMiddleware, async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await itemsCollection.insertOne({ name, price, category });
    res.status(201).json({ id: result.insertedId });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== PATCH (PROTECTED) =====
app.patch('/api/items/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== DELETE (OPTIONAL, PROTECTED) =====
app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await itemsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
