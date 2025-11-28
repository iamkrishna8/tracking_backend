const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "krishnachenchuboina@gmail.com",
    pass: "nkixnabgnfptnktc",
  },
});

function sendEmail(to, sub, msg) {
  transporter.sendMail({
    to: to,
    subject: sub,
    html: msg,
  });
  console.log("Email Sent successfully");
}

module.exports = sendEmail;
