import * as nodersa from 'node-forge';
import * as fs from 'fs-extra';

const publicPath = 'certificates/public.pem';
const key = nodersa;
const privatePath = 'certificates/private.pem';
export class RSA {
  async generateKeys() {
    const isFilePresent = await this.checkFile();
    const salt = nodersa.random.getBytesSync(32);
    if (!isFilePresent) {
      await this.createFile().catch(e => {
        throw new Error('File cannot be created');
      });
      await this.writeFile(
        publicPath,
        nodersa.util.bytesToHex(
          nodersa.pkcs5.pbkdf2(process.env.ENCRYPTION_SECRET, salt, 14, 32),
        ),
      );
      await this.writeFile(
        privatePath,
        nodersa.util.bytesToHex(nodersa.random.getBytesSync(32)),
      );
    }
  }

  private async checkFile() {
    const isPublicCertificate = await fs.pathExists(publicPath);
    const isPrivateCertificate = await fs.pathExists(privatePath);
    return isPublicCertificate && isPrivateCertificate;
  }

  private async createFile() {
    await fs.ensureFile(publicPath);
    await fs.ensureFile(privatePath);
  }

  private async writeFile(file, data) {
    await fs.writeFile(file, data);
  }

  private async readFile(file) {
    return fs.readFile(file, 'utf-8');
    // return string.replace(/(\r\n|\n|\r)/gm, "");
  }

  // private removeRemarks(string: string) {
  //   return string.replace(/(-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----)/gm, '')
  // }

  async getPublicKey() {
    return await this.readFile(publicPath);
  }

  async getPrivateKey() {
    return await this.readFile(privatePath);
  }

  async decrypt(data) {
    const iv = await this.getPrivateKey();
    const dkey = await this.getPublicKey();
    const cipher = nodersa.cipher.createDecipher(
      'AES-CBC',
      nodersa.util.hexToBytes(dkey),
    );
    cipher.start({
      iv: nodersa.util.hexToBytes(iv),
    });
    cipher.update(
      nodersa.util.createBuffer(nodersa.util.hexToBytes(data.asdata)),
    );
    cipher.finish();
    // if(){
    return JSON.parse(cipher.output.toString());
    // }
  }
}
