const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Create Transporter (service that will send email like gmail or hotmail or mailtrap)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // if secure false port = 587 else 465
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  //Define Email Options (like from, to, subject, text, html)
  const mailOptions = {
    from: `Admin <${process.env.SMTP_EMAIL}>`, //sender
    to: options.email, //receiver
    subject: options.subject,
    text: options.message,
  };
  //send Email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
