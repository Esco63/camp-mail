import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@sanity/client';

// 🔐 Lade .env-Konfiguration
dotenv.config();

// 🧠 Sanity-Client initialisieren
const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// 📨 Mail-Transporter (z. B. Gmail SMTP oder Mailjet)
const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🚀 Express App Setup
const app = express();
app.use(express.json());

// 📩 Anfrage-Endpunkt (Frontend schickt POST an /anfrage)
app.post('/anfrage', async (req, res) => {
  try {
    const { name, email, nachricht } = req.body;

    // In Sanity speichern
    await sanity.create({
      _type: 'kontaktanfrage',
      name,
      email,
      nachricht,
      gelesen: false,
      erstelltAm: new Date().toISOString(),
    });

    // E-Mail senden
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

// 🌍 Auf PORT von Render hören
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
