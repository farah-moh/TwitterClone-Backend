const nodemailer = require('nodemailer');

module.exports = async options => {
    const transporter = nodemailer.createTransport();
  
    const mailOptions = {
      from: 'Sirius Support <support@sirius.me>',
      to: options.email,
      subject: options.subject,
      text: options.message
    };
  
    await transporter.sendMail(mailOptions);
  };