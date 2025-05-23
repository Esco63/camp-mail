import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@sanity/client';

// 🔐 .env laden
dotenv.config();

// 🌐 CORS aktivieren (Frontend darf zugreifen)
const app = express();
app.use(cors());
app.use(express.json());

// 🧠 Sanity Client
const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// 📬 Nodemailer
const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📩 Anfrage-Endpunkt
app.post('/anfrage', async (req, res) => {
  try {
    const { name, email, nachricht } = req.body;

    await sanity.create({
      _type: 'kontaktanfrage',
      name,
      email,
      nachricht,
      gelesen: false,
      erstelltAm: new Date().toISOString(),
    });

    await mailer.sendMail({
      from: `"Website Anfrage" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: '📩 Neue Anfrage von der Website',
      text: `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${nachricht}`,
    });

    res.send({ status: 'OK' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: 'Fehler beim Speichern oder Senden' });
  }
});

// 🟢 Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
