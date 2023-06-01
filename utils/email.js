const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(userSender, userReceiver, url) {
    this.to = Array.isArray(userReceiver)
      ? userReceiver.map((r) => r.email)
      : userReceiver.email;
    this.senderName = `${userSender.firstname} ${userSender.lastname}`;
    this.url = url;
    this.from = `Owly ${userSender.role} <${userSender.email}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject, meeting) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../public/email/${template}.pug`,
      {
        senderName: this.senderName,
        url: this.url,
        subject,
        meeting,
      }
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: htmlToText(html),
    };

    // 3) Creater a transport and send email
    console.log("SENDING EMAIL");
    await this.newTransport().sendMail(mailOptions);
  }

  async sendPasswordCreate() {
    await this.send("welcome", "Welcome to the Owly!");
  }

  async sendMeetingDetails(meeting) {
    await this.send("meeting", "Invitation to join the meeting", meeting);
  }
};
