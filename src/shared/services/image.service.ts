import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

const paths = './uploads/';
export class ImageService {
  constructor() {}

  async addImage(rawImage, imgName) {
    const image = this.decodeBase64Image(rawImage).data;
    return new Promise<string>((resolve, reject) =>
      fs.writeFile(`${paths}${imgName}.png`, image, err => {
        if (err) reject(err);
        else resolve(`${imgName}.png`);
      }),
    );
  }

  async deleteImage(imgName) {
    fs.unlink(imgName, err => {});
  }

  private decodeBase64Image(dataString) {
    // var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    let response: any = {};

    // if (matches.length !== 3) {
    //   return new Error('Invalid input string');
    // }

    // response.type = matches[1];
    response.data = Buffer.from(dataString, 'base64');

    return response;
  }
}
