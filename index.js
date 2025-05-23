const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const sanityClient = require('@sanity/client');

dotenv.config()
const app = express()
app.use(express.json())

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

app.post('/anfrage', async (req, res) => {
  try {
    const { name, email, nachricht } = req.body

    await client.create({
      _type: 'kontaktanfrage',
      name,
      email,
      nachricht,
    })

    await transporter.sendMail({
      from: `"Website Anfrage" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: '📩 Neue Anfrage von der Website',
      text: `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${nachricht}`,
    })

    res.send({ status: 'OK' })
  } catch (err) {
    console.error(err)
    res.status(500).send({ status: 'Fehler beim Speichern oder Senden' })
  }
})
