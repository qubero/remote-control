import { createReadStream } from 'fs';
import { resolve, dirname } from 'path';
import { createServer } from 'http';
import { pipeline } from 'stream/promises';

enum HttpCode {
  OK = 200,
  NotFound = 404,
}

const ContentType = {
  TEXT: { 'Content-Type': 'text/html; charset=utf-8' },
  JSON: { 'Content-Type': 'application/json' },
};

export const httpServer = createServer(async (req, res) => {
  try {
    const __dirname = resolve(dirname(''));
    const file_path = __dirname + (req.url === '/' ? '/front/index.html' : '/front' + req.url);

    res.writeHead(HttpCode.OK, ContentType.TEXT);
    await pipeline(
      createReadStream(file_path),
      res
    );
  } catch (err) {
    res.writeHead(HttpCode.NotFound, ContentType.JSON);
    res.end(JSON.stringify(err));
  }
});
