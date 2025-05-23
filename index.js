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
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #ec4899; text-align: center; margin-bottom: 20px;">📩 Neue Anfrage von der Camp-Website</h2>
            
            <table style="width: 100%; font-size: 15px; line-height: 1.6;">
              <tr>
                <td style="font-weight: bold; width: 130px;">👤 Name:</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">📧 E-Mail:</td>
                <td><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="font-weight: bold; vertical-align: top;">💬 Nachricht:</td>
                <td style="white-space: pre-line;">${nachricht}</td>
              </tr>
            </table>

            <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">

            <p style="font-size: 12px; color: #999; text-align: center;">
              Diese Nachricht wurde automatisch von der Website <strong>camp-schwerin.de</strong> gesendet.
            </p>
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
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 650px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #ec4899; text-align: center; margin-bottom: 20px;">📆 Neue Buchungsanfrage</h2>
            
            <table style="width: 100%; font-size: 15px; line-height: 1.6;">
              <tr>
                <td style="font-weight: bold; width: 160px;">👤 Name:</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">📧 E-Mail:</td>
                <td><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="font-weight: bold;">📱 Telefon:</td>
                <td>${telefonnummer}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">📅 Datum:</td>
                <td>${datum}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">👥 Personenanzahl:</td>
                <td>${personenanzahl}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">🎯 Veranstaltungstyp:</td>
                <td>${typ}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; vertical-align: top;">📝 Nachricht:</td>
                <td style="white-space: pre-line;">${nachricht}</td>
              </tr>
            </table>

            <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">

            <p style="font-size: 12px; color: #999; text-align: center;">
              Automatisch über das Buchungsformular auf <strong>camp-schwerin.de</strong> gesendet.
            </p>
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
