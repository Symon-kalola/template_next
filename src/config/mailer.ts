import nodemailer from "nodemailer";
import { env } from "./env";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const defaultFrom = `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`;

export const sendMail = (options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) =>
  transporter.sendMail({
    from: defaultFrom,
    ...options,
  });
