import nodemailer from "nodemailer";

const SendMail = ({
  from,
  to,
  subject,
  text,
  html,
}: {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST as string,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: process.env.EMAIL_SERVER_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions: {
      from: string;
      to: string;
      subject: string;
      text?: string;
      html?: string;
    } = {
      from: from,
      to: to,
      subject: subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log("Sending Email success\n send email to: " + info.response);
    });
  } catch (err) {
    console.log("Error sending email:", err);
  }
};

export default SendMail;
