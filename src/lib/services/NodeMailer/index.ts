import nodemailer from "nodemailer";
import { SendMailProps } from "@/lib/types/nodeMailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST as string,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const SendMail = async ({ from, to, subject, text, html }: SendMailProps) => {
  const fromName =
    process.env.EMAIL_USER_DISPLAY ||
    `"ECT Chatbot Admin" <${process.env.EMAIL_USER}>`;
  const finalFrom = from || fromName;

  return new Promise((resolve, reject) => {
    try {
      const mailOptions: {
        from: string;
        to: string;
        subject: string;
        text?: string;
        html?: string;
      } = {
        from: finalFrom as string,
        to: to,
        subject: subject,
        ...(text ? { text } : {}),
        ...(html ? { html } : {}),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email:", error);
          return reject(error);
        }
        console.log("Sending Email success\n send email to: " + info.response);
        resolve(info);
      });
    } catch (err) {
      console.log("Error in SendMail wrapper:", err);
      reject(err);
    }
  });
};

export default SendMail;
