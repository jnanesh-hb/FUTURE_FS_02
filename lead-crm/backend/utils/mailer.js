// Mailer Utility
// Sends optional email notifications when SMTP credentials are configured.

const nodemailer = require('nodemailer');

const canSendEmail = () =>
  Boolean(
    process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD &&
      process.env.EMAIL_FROM
  );

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

exports.sendNewLeadNotification = async (lead) => {
  if (!canSendEmail()) {
    return false;
  }

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: `New lead received: ${lead.firstName} ${lead.lastName}`,
      text: [
        'A new lead was created in the Mini CRM.',
        `Name: ${lead.firstName} ${lead.lastName}`,
        `Email: ${lead.email}`,
        `Phone: ${lead.phone}`,
        `Company: ${lead.company}`,
        `Source: ${lead.source}`,
      ].join('\n'),
    });

    return true;
  } catch (error) {
    console.error('Email notification failed:', error.message);
    return false;
  }
};
