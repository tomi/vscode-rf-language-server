import * as fs from "fs";

export function readFileAsync(
  filename: string,
  encoding: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, encoding, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
