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

// 📩 Kontakt-Endpunkt
app.post('/anfrage', (req, res) => {
  const { name, email, nachricht } = req.body;

  res.send({ status: 'OK' }); // sofortige Rückmeldung

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
        html: `
          <div style="font-family: sans-serif; padding: 10px;">
            <h2 style="color: #ec4899;">📩 Neue Anfrage von der Website</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Nachricht:</strong><br>${nachricht.replace(/\n/g, '<br>')}</p>
            <hr>
            <p style="font-size: 12px; color: #999;">Automatische Benachrichtigung – nicht antworten</p>
          </div>
        `
      });

      console.log(`✅ Anfrage von ${name} verarbeitet.`);
    } catch (err) {
      console.error('❌ Fehler bei Anfrage:', err);
    }
  })();
});

// 📆 Buchungs-Endpunkt
app.post('/buchung', (req, res) => {
  const {
    name, email, telefonnummer,
    datum, personenanzahl, typ, nachricht
  } = req.body;

  res.send({ status: 'OK' }); // sofortige Rückmeldung

  (async () => {
    try {
      await sanity.create({
        _type: 'buchungsanfrage',
        name,
        email,
        telefonnummer,
        datum,
        personenanzahl,
        typ,
        nachricht,
        eingegangenAm: new Date().toISOString()
      });

      await mailer.sendMail({
        from: `"Buchung - Camp Schwerin" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        subject: '📆 Neue Buchungsanfrage',
        html: `
          <div style="font-family: sans-serif; padding: 10px;">
            <h2 style="color:#ec4899;">📆 Neue Buchungsanfrage</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Telefon:</strong> ${telefonnummer}</p>
            <p><strong>Datum:</strong> ${datum}</p>
            <p><strong>Personenanzahl:</strong> ${personenanzahl}</p>
            <p><strong>Typ:</strong> ${typ}</p>
            <p><strong>Nachricht:</strong><br>${nachricht.replace(/\n/g, '<br>')}</p>
            <hr>
            <p style="font-size: 12px; color: #999;">Automatisch versendet vom Camp-Formular</p>
          </div>
        `
      });

      console.log(`✅ Buchung von ${name} verarbeitet.`);
    } catch (err) {
      console.error('❌ Fehler bei Buchung:', err);
    }
  })();
});

// 🟢 Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
