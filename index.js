import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@sanity/client';

// 🔐 .env laden
dotenv.config();

// 🌐 Express App + CORS
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

// 📬 Mailer
const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📩 Kontakt-Endpunkt – jetzt schnell!
app.post('/anfrage', (req, res) => {
  const { name, email, nachricht } = req.body;

  // 👉 sofortige Rückmeldung an Website-Besucher
  res.send({ status: 'OK' });

  // 🧠 Speichern & Mail im Hintergrund
  (async () => {
    try {
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

      console.log(`✅ Anfrage von ${name} erfolgreich verarbeitet.`);
    } catch (err) {
      console.error('❌ Fehler im Hintergrund:', err);
    }
  })();
});

// 🟢 Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
