const express = require('express');
const dotenv = require('dotenv');
const Redis = require("ioredis");
const pasteRoutes = require('./routes/paste.js');
const path = require('path');


dotenv.config();

const app = express();
app.use(express.json());

/* -------------------- serve Frontend -------------------- */
app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 3000;
const redis = new Redis(process.env.REDIS_URL);

/* -------------------- Health Check -------------------- */
app.get("/api/healthz", async (req, res) => {
  try {
    await redis.ping();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

/* -------------------- Routes -------------------- */
app.use(pasteRoutes);
/* -------------------- Start Server -------------------- */
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});