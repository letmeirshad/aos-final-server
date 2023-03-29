import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';

@Injectable()
export class EmailService {
  constructor() {}

  async sendEmail(emailOptions) {
    const transporter = createTransport({
      //host: 'smtp.sendgrid.net',
      host: 'smtp.gmail.com',
      //port: 587,
      port: 465,
      // auth: {
      //   user: 'apikey',
      //   pass: process.env.EMAIL_PWD,
      // },
      //service: 'gmail',

      //host: 'smtp.gmail.com',
      //port: "465",
      
      secure: true,
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PWD
      }
    });

    transporter.sendMail(emailOptions, (err, info) => {
      if (err) {
        throw 'Error while sending email';
      }
    });
  }
}
