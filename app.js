import multer from 'multer';
import express from 'express';
import nodeMailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config();






const app = express();
const port = process.env.PORT || 5000; 



app.use(express.json());

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'multipart/form-data'] }));

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Specify the directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use a unique filename
  }
});

const upload = multer({ storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 25 MB
  }
 });

const from = process.env.EMAIL_FROM;
const to = process.env.EMAIL_TO;
const subject = 'Nouveau Message de alpinealuminiuminc.com';

const transport = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
});

app.get('/', (req, res) => {
  res.status(200).send('OK');
});


app.post('/send-email', upload.array('attachment', 5), (req, res) => {
  const { nom, Numero, courriel, message } = req.body;
  const files = req.files;

  const emailOptions = {
    from,
    to,
    subject,
    replyTp: courriel,
    html: `
    <p><strong>Nom:</strong> ${nom}</p>
    <p><strong>Numéro:</strong> ${Numero}</p>
    <p><strong>Courriel:</strong> ${courriel}</p>
    <p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
  `,
    attachments: files ? files.map(file => ({ filename: file.originalname, path: file.path })) : []
  };

  transport.sendMail(emailOptions)
    .then(() => {
      console.log('Email sent');
      res.status(200).send('Email sent successfully');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send(`
        <h1>Erreur</h1>
        <p>Il y a eu une erreur lors de l'envoi du courriel. Veuillez essayer plus tard</p>
      `);
    });
});



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

