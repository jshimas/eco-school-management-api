const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(userSender, recipients, url) {
    this.to = Array.isArray(recipients)
      ? recipients.map((r) => r.email)
      : [recipients.email];
    this.senderName = `${userSender.firstname} ${userSender.lastname}`;
    this.url = url;
    this.from = `Owly ${userSender.role} <${process.env.EMAIL_USERNAME}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
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

    Promise.all(
      this.to.forEach(async (recipient) => {
        const mailOptions = {
          from: this.from,
          to: recipient,
          subject: subject,
          html,
          text: htmlToText(html),
        };

        console.log("SENDING EMAIL");
        await new Promise((resolve, reject) => {
          this.newTransport().sendMail(mailOptions, (err, info) => {
            if (err) {
              console.error(err);
              reject(err);
            } else {
              resolve(info);
            }
          });
        });
      })
    );
  }

  sendPasswordCreate() {
    this.send("welcome", "Welcome to the Owly!");
  }

  sendMeetingDetails(meeting) {
    this.send("meeting", "Invitation to join the meeting", meeting);
  }
};
