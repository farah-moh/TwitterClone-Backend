const nodemailer = require('nodemailer');

module.exports = async options => {
    const transporter = nodemailer.createTransport({
      // host: 'smtp.mail.yahoo.com',
      // port: 465,
      // service:'yahoo',
      // secure: true,
      // auth: {
      //    user: 'siriusFarahBoody@yahoo.com',
      //    pass: 'auiupxvolctoucla'
      // }
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: "v5s4nudndxsfcyzn@ethereal.email", // service is detected from the username
        pass: "NZzuxcFbPbDvTtvdkv"
    }
    });
  
    const mailOptions = {
      from: 'Sirius Support <support@sirius.me>',
      to: options.email,
      subject: options.subject,
      text: options.message
    };
  
    await transporter.sendMail(mailOptions);
  };