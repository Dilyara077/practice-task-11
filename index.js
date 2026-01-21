const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const url = 'mongodb+srv://Dilyara:dilyara010203@cluster0.ts6k7fi.mongodb.net/shop';
const client = new MongoClient(url);

let productsCollection;

async function connectDB() {
  await client.connect();
  const db = client.db('shop');
  productsCollection = db.collection('products');
  console.log('Connected to MongoDB Atlas');
}

connectDB();


app.get('/', (req, res) => {
  res.send(`
    <h2>Practice Task 10</h2>
    <ul>
      <li><a href="/api/products">/api/products</a></li>
      <li><a href="/api/products?category=Electronics">/api/products?category=Electronics</a></li>
      <li><a href="/api/products?minPrice=50">/api/products?minPrice=50</a></li>
      <li><a href="/api/products?sort=price">/api/products?sort=price</a></li>
      <li><a href="/api/products?fields=name,price">/api/products?fields=name,price</a></li>
    </ul>
  `);
});

app.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, sort, fields } = req.query;

    const filter = {};
    if (category) {
      filter.category = category;
    }
    if (minPrice) {
      filter.price = { $gte: Number(minPrice) };
    }

    let projection = {};
    if (fields) {
      fields.split(',').forEach(field => {
        projection[field] = 1;
      });
    }


    let sortOption = {};
    if (sort === 'price') {
      sortOption.price = 1;
    }

    const products = await productsCollection
      .find(filter, { projection })
      .sort(sortOption)
      .toArray();

    res.json({
      count: products.length,
      products
    });

  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid id' });
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

app.post('/api/products', async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await productsCollection.insertOne({
      name,
      price,
      category
    });

    res.status(201).json({
      id: result.insertedId,
      name,
      price,
      category
    });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
