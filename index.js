require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

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

// ===== VERSION =====
app.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Practice Task 12 API',
    status: 'running'
  });
});


// ===== ROOT =====
app.get('/', (req, res) => {
  res.json({ message: 'Practice Task 13 API is running', version: '1.0.0' });
});

// ===== GET ALL =====
app.get('/api/items', async (req, res) => {
  try {
    const items = await itemsCollection.find().toArray();
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== GET BY ID =====
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

// ===== POST =====
app.post('/api/items', async (req, res) => {
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

// ===== PUT (FULL UPDATE) =====
app.put('/api/items/:id', async (req, res) => {
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

    res.json({ message: 'Item updated (PUT)' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== PATCH (PARTIAL UPDATE) =====
app.patch('/api/items/:id', async (req, res) => {
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

    res.json({ message: 'Item updated (PATCH)' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== DELETE =====
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await itemsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(204).send();
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
