const nodemailer = require('nodemailer');

module.exports = async options => {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
          user: 'abdelrahman.m.ezzat@gmail.com',
          pass: 'B01095050'
      }

    //   host: 'smtp.ethereal.email',
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: "v5s4nudndxsfcyzn@ethereal.email", // service is detected from the username
    //     pass: "NZzuxcFbPbDvTtvdkv"
    // }
    });
  
    // transporter.verify(function (error, success) {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log("Server is ready to take our messages");
    //   }
    // });

    const mailOptions = {
      from: 'Sirius Support <support@sirius.me>',
      to: options.email,
      subject: options.subject,
      text: options.message
    };
  
    await transporter.sendMail(mailOptions);
  };