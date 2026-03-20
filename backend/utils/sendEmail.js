const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

  await transporter.sendMail({
    from: `"FinTrack" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  console.log('✅ Email sent:', info.messageId);
};

module.exports = sendEmail;