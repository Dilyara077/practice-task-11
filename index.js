require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ===== API KEY (Practice Task 14) =====
const API_KEY = 'my-secret-key';

// ===== AUTH MIDDLEWARE =====
function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

const client = new MongoClient(MONGO_URI);
let itemsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('shop');
    itemsCollection = db.collection('items');
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
connectDB();

// ===== ROOT =====
app.get('/', (req, res) => {
  res.json({ message: 'Practice Task 14 API is running' });
});

// ===== VERSION =====
app.get('/version', (req, res) => {
  res.json({
    version: '1.2.0',
    task: 'Practice Task 14',
    protection: 'API key middleware'
  });
});

// ===== GET ALL (UNPROTECTED) =====
app.get('/api/items', async (req, res) => {
  try {
    const items = await itemsCollection.find().toArray();
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== GET BY ID (UNPROTECTED) =====
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
app.post('/api/items', apiKeyAuth, async (req, res) => {
  const { name, price } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await itemsCollection.insertOne({ name, price });
    res.status(201).json({ id: result.insertedId });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== PUT (PROTECTED) =====
app.put('/api/items/:id', apiKeyAuth, async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, price } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== PATCH (PROTECTED) =====
app.patch('/api/items/:id', apiKeyAuth, async (req, res) => {
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

    res.json({ message: 'Item updated' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== DELETE (PROTECTED) =====
app.delete('/api/items/:id', apiKeyAuth, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await itemsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
