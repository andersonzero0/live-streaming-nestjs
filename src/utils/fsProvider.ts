import fs from 'fs';

export const fsProvider = {
  exists(req: Request, cb: (err: any, exists: boolean) => void) {
    fs.exists(req['filePath'], (exists: boolean) => cb(null, exists));
  },
  getSegmentStream(
    req: Request,
    cb: (err: any, stream: fs.ReadStream) => void,
  ) {
    cb(null, fs.createReadStream(req['filePath']));
  },
  getManifestStream(
    req: Request,
    cb: (err: any, stream: fs.ReadStream) => void,
  ) {
    cb(
      null,
      fs.createReadStream(req['filePath'], { highWaterMark: 64 * 1024 }),
    );
  },
};
