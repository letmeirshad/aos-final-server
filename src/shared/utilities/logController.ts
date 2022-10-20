import * as path from 'path';
import * as fs from 'fs';
import * as rootPath from 'app-root-path';

export { ReadStream } from 'fs';
export { EventEmitter } from 'events';
export { Readable, Writable } from 'stream';

export class LogController {
  static pathNormalize(pathStr: string): string {
    return path.normalize(pathStr);
  }

  static pathExtName(pathStr: string): string {
    return path.extname(pathStr);
  }

  static pathResolve(pathStr: string): string {
    return path.resolve(pathStr);
  }

  static fileExist(pathStr: string): boolean {
    return fs.existsSync(pathStr);
  }

  static readFileSync(filename: string): Buffer {
    return fs.readFileSync(filename);
  }

  static appendFileSync(filename: string, data: any): void {
    fs.appendFileSync(filename, data);
  }

  static async writeFile(path: string, data: any): Promise<void> {
    return new Promise<void>((ok, fail) => {
      fs.writeFile(path, data, err => {
        if (err) fail(err);
        ok();
      });
    });
  }

  static write(strings: string | string[]) {
    strings = strings instanceof Array ? strings : [strings];
    const basePath = rootPath.path;
    strings = (strings as string[]).map(
      str => '[' + new Date().toISOString() + ']' + str,
    );
    fs.appendFileSync(basePath + '/ormlogs.log', strings.join('\r\n') + '\r\n');
  }
}
