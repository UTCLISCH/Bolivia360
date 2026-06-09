import dotenv from 'dotenv';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { MongoClient } from 'mongodb';

dotenv.config();

const PORT = Number(process.env.API_PORT || 3001);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'chuquiago360';
const CATEGORIES = ['Aventura', 'Cultural', 'Naturaleza', 'Gastronómica'];

const INITIAL_LUGARES = [
  { id: 1, title: 'Salar de Uyuni', image: 'https://picsum.photos/seed/uyuni/800/600', desc: 'El mayor desierto de sal continuo y alto del mundo. Una experiencia visual única en el departamento de Potosí.', price: '$150', priceNum: 150, rating: '4.9', stock: 12, category: 'Naturaleza', duration: '2 días' },
  { id: 2, title: 'Lago Titicaca', image: 'https://picsum.photos/seed/titicaca/800/600', desc: 'El lago navegable más alto del mundo, rodeado de misticismo andino y cultura milenaria.', price: '$80', priceNum: 80, rating: '4.7', stock: 8, category: 'Cultural', duration: '1 día' },
  { id: 3, title: 'Parque Madidi', image: 'https://picsum.photos/seed/madidi/800/600', desc: 'Reserva con inmensa biodiversidad en la Amazonía boliviana. Fauna y flora únicas en el planeta.', price: '$200', priceNum: 200, rating: '4.8', stock: 3, category: 'Aventura', duration: '3 días' },
  { id: 4, title: 'Misiones Jesuíticas', image: 'https://picsum.photos/seed/misiones/800/600', desc: 'Patrimonio cultural UNESCO en la Chiquitanía. Un viaje fascinante al pasado colonial boliviano.', price: '$120', priceNum: 120, rating: '4.6', stock: 2, category: 'Cultural', duration: '1 día' },
  { id: 5, title: 'Camino de la Muerte', image: 'https://picsum.photos/seed/deathroad/800/600', desc: 'La ruta más emocionante de Bolivia en bicicleta. Descenso de 3.600 m con vistas espectaculares.', price: '$75', priceNum: 75, rating: '4.8', stock: 15, category: 'Aventura', duration: '1 día' },
  { id: 6, title: 'Valle de la Luna', image: 'https://picsum.photos/seed/valleluna/800/600', desc: 'Formaciones geológicas lunares a las afueras de La Paz. Erosiones milenarias de arcilla y yeso.', price: '$30', priceNum: 30, rating: '4.5', stock: 25, category: 'Naturaleza', duration: '3 horas' },
];

const INITIAL_REVIEWS = [
  { id: 1, lugarId: 1, user: 'María G.', rating: 5, comment: '¡Increíble experiencia! El atardecer en el salar fue absolutamente mágico. Imposible describirlo con palabras.', date: '2024-03-15' },
  { id: 2, lugarId: 1, user: 'Carlos R.', rating: 4, comment: 'Muy bien organizado. Los guías son excelentes y el paisaje es como de otro mundo.', date: '2024-03-10' },
  { id: 3, lugarId: 2, user: 'Sofía M.', rating: 5, comment: 'Las islas flotantes de los Uros son fascinantes. Una cultura viva e impresionante.', date: '2024-02-20' },
  { id: 4, lugarId: 3, user: 'Pedro L.', rating: 5, comment: 'La biodiversidad es abrumadora. Vi especies que jamás había imaginado. ¡Obligatorio!', date: '2024-01-12' },
  { id: 5, lugarId: 5, user: 'Ana P.', rating: 5, comment: 'Adrenalina pura de principio a fin. El paisaje durante el descenso es absolutamente espectacular.', date: '2024-03-20' },
  { id: 6, lugarId: 5, user: 'Luis F.', rating: 4, comment: 'Excelente organización y equipamiento de primera calidad. Un recuerdo que llevaré siempre.', date: '2024-03-18' },
];

const app = express();
app.use(express.json({ limit: '6mb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}));

const mongoClient = new MongoClient(MONGODB_URI);
await mongoClient.connect();
const db = mongoClient.db(MONGODB_DB);
const lugaresCollection = db.collection('lugares');
const reviewsCollection = db.collection('reviews');
const reservasCollection = db.collection('reservas');

await Promise.all([
  lugaresCollection.createIndex({ id: 1 }, { unique: true }),
  reviewsCollection.createIndex({ id: 1 }, { unique: true }),
  reservasCollection.createIndex({ id: 1 }, { unique: true }),
]);

if ((await lugaresCollection.countDocuments()) === 0) {
  await lugaresCollection.insertMany(INITIAL_LUGARES);
}
if ((await reviewsCollection.countDocuments()) === 0) {
  await reviewsCollection.insertMany(INITIAL_REVIEWS);
}

const nextId = async (collection) => {
  const latest = await collection.find({}, { projection: { id: 1 } }).sort({ id: -1 }).limit(1).toArray();
  return (latest[0]?.id || 0) + 1;
};

const sanitizeLugar = (lugar) => {
  if (!lugar || typeof lugar !== 'object') return null;
  const title = typeof lugar.title === 'string' ? lugar.title.trim() : '';
  const desc = typeof lugar.desc === 'string' ? lugar.desc.trim() : '';
  const image = typeof lugar.image === 'string' ? lugar.image.trim() : '';
  const duration = typeof lugar.duration === 'string' ? lugar.duration.trim() : '';
  const category = typeof lugar.category === 'string' ? lugar.category : '';
  const priceNum = Number(lugar.priceNum);
  const stock = Number(lugar.stock);
  const rating = Number(lugar.rating);
  const hasDataImage = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(image);
  const hasHttpImage = /^https?:\/\//i.test(image);

  if (!title || !desc || !duration || !image || !CATEGORIES.includes(category)) return null;
  if (!hasDataImage && !hasHttpImage) return null;
  if (image.length > 5_500_000) return null;
  if (!Number.isFinite(priceNum) || priceNum <= 0) return null;
  if (!Number.isInteger(stock) || stock < 0) return null;
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) return null;

  return {
    title,
    desc,
    image,
    duration,
    category,
    stock,
    priceNum,
    price: `$${priceNum}`,
    rating: rating.toFixed(1),
  };
};

const sanitizeReview = (review) => {
  if (!review || typeof review !== 'object') return null;
  const lugarId = Number(review.lugarId);
  const rating = Number(review.rating);
  const user = typeof review.user === 'string' ? review.user.trim() : '';
  const comment = typeof review.comment === 'string' ? review.comment.trim() : '';
  const date = typeof review.date === 'string' ? review.date : new Date().toISOString().split('T')[0];
  if (!Number.isInteger(lugarId) || lugarId <= 0) return null;
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  if (!user || !comment) return null;
  return { lugarId, rating, user, comment, date };
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/lugares', async (_req, res, next) => {
  try {
    const lugares = await lugaresCollection.find({}, { projection: { _id: 0 } }).sort({ id: 1 }).toArray();
    res.json(lugares);
  } catch (error) {
    next(error);
  }
});

app.post('/api/lugares', async (req, res, next) => {
  try {
    const payload = sanitizeLugar(req.body);
    if (!payload) return res.status(400).json({ message: 'Datos de lugar inválidos.' });
    const newLugar = { ...payload, id: await nextId(lugaresCollection) };
    await lugaresCollection.insertOne(newLugar);
    res.status(201).json(newLugar);
  } catch (error) {
    next(error);
  }
});

app.put('/api/lugares/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'ID inválido.' });
    const payload = sanitizeLugar(req.body);
    if (!payload) return res.status(400).json({ message: 'Datos de lugar inválidos.' });
    const updated = { ...payload, id };
    const result = await lugaresCollection.findOneAndUpdate(
      { id },
      { $set: updated },
      { returnDocument: 'after', projection: { _id: 0 } },
    );
    if (!result) return res.status(404).json({ message: 'Lugar no encontrado.' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/lugares/:id/stock', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const stock = Number(req.body?.stock);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ message: 'Stock inválido.' });
    }
    const result = await lugaresCollection.findOneAndUpdate(
      { id },
      { $set: { stock } },
      { returnDocument: 'after', projection: { _id: 0 } },
    );
    if (!result) return res.status(404).json({ message: 'Lugar no encontrado.' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/lugares/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'ID inválido.' });
    const result = await lugaresCollection.deleteOne({ id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Lugar no encontrado.' });
    await Promise.all([
      reviewsCollection.deleteMany({ lugarId: id }),
      reservasCollection.deleteMany({ lugarId: id }),
    ]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/reviews', async (req, res, next) => {
  try {
    const lugarId = req.query?.lugarId ? Number(req.query.lugarId) : null;
    const filter = lugarId && Number.isInteger(lugarId) ? { lugarId } : {};
    const reviews = await reviewsCollection.find(filter, { projection: { _id: 0 } }).sort({ id: -1 }).toArray();
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

app.post('/api/reviews', async (req, res, next) => {
  try {
    const payload = sanitizeReview(req.body);
    if (!payload) return res.status(400).json({ message: 'Datos de reseña inválidos.' });
    const lugar = await lugaresCollection.findOne({ id: payload.lugarId }, { projection: { id: 1 } });
    if (!lugar) return res.status(404).json({ message: 'Lugar no encontrado.' });
    const review = { ...payload, id: await nextId(reviewsCollection) };
    await reviewsCollection.insertOne(review);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

app.post('/api/reservas', async (req, res, next) => {
  try {
    const lugarId = Number(req.body?.lugarId);
    const quantity = Number(req.body?.quantity);
    const date = typeof req.body?.date === 'string' ? req.body.date : '';
    if (!Number.isInteger(lugarId) || lugarId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || !date) {
      return res.status(400).json({ message: 'Datos de reserva inválidos.' });
    }

    const lugar = await lugaresCollection.findOneAndUpdate(
      { id: lugarId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { returnDocument: 'after', projection: { _id: 0 } },
    );
    if (!lugar) return res.status(409).json({ message: 'No hay cupos suficientes.' });

    const reserva = {
      id: await nextId(reservasCollection),
      lugarId,
      quantity,
      date,
      total: lugar.priceNum * quantity,
      createdAt: new Date().toISOString(),
    };
    await reservasCollection.insertOne(reserva);
    res.status(201).json({ reserva, lugar });
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`Chuquiago360 API listening on port ${PORT}`);
});

const shutdown = async () => {
  await mongoClient.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
