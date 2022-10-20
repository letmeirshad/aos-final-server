import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';

@Injectable()
export class EmailService {
  constructor() {}

  async sendEmail(emailOptions) {
    const transporter = createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_PWD,
      },
      // service: 'gmail',
      // auth: {
      //   user: process.env.EMAIL_ID,
      //   pass: process.env.EMAIL_PWD
      // }
    });

    transporter.sendMail(emailOptions, (err, info) => {
      if (err) {
        throw 'Error while sending email';
      }
    });
  }
}
