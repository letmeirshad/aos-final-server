import * as fs from 'fs';
import * as excel2JSON from 'convert-excel-to-json';

export class ExcelService {
  constructor() {}

  async convertToJSON(filename) {
    return this.extractJSON(filename).Sheet1;
  }

  async convertToJSONS(filename) {
    return this.extractJSON(filename);
  }

  async deleteImage(imgName) {
    fs.unlink(imgName, err => {});
  }

  private extractJSON(path) {
    const result = excel2JSON({
      sourceFile: path,
      header: {
        rows: 1,
      },
      columnToKey: {
        '*': '{{columnHeader}}',
      },
    });

    fs.unlink(path, () => {});

    return result;
  }
}
