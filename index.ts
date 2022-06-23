import Jimp from 'jimp';
import { httpServer } from './src/http_server/index';
import robot from 'robotjs';
import { createWebSocketStream, WebSocketServer } from 'ws';
import type { DuplexOptions } from 'stream';

const HTTP_PORT = Number(process.env.HTTP_PORT) || 3000;
const WSS_PORT = Number(process.env.WSS_PORT) || 8080;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: WSS_PORT });

const { width: X_MAX, height: Y_MAX } = robot.getScreenSize();
const X_MIN = 0;
const Y_MIN = 0;

wss.on('connection', (ws) => {
  const wsStreamOptions: DuplexOptions = {
    encoding: 'utf8',
    decodeStrings: false,
  };
  const duplex = createWebSocketStream(ws, wsStreamOptions);

  duplex.on('readable', async () => {
    let data = '',
      chunk = '';

    while (chunk !== null) {
      data += chunk;
      chunk = duplex.read();
    }

    const [command, ...args] = data.split(' ');
    const result: string | number = await handleCommand(command, args.map(Number));
    duplex.write(`${command} ${result}`, () => { console.log('Done!') });
  });

  duplex.on('end', () => console.log('There will be no more data.'));
  ws.on('close', () => duplex.destroy());
});

const handleCommand = async (command: string, rest: Array<number>): Promise<string | number> => {
  if (command.startsWith('mouse_')) {
    const [offset] = rest;
    const { x, y } = robot.getMousePos();

    if (command === 'mouse_up') {
      const newY = (y - offset) < Y_MIN ? Y_MIN : (y - offset);
      robot.moveMouse(x, newY);
      return newY;

    } else if (command === 'mouse_down') {
      const newY = (y + offset) > Y_MAX ? Y_MAX : (y + offset);
      robot.moveMouse(x, newY);
      return newY;

    } else if (command === 'mouse_left') {
      const newX = (x - offset) < X_MIN ? X_MIN : (x - offset);
      robot.moveMouse(newX, y);
      return newX;

    } else if (command === 'mouse_right') {
      const newX = (x + offset) > X_MAX ? X_MAX : (x + offset);
      robot.moveMouse(newX, y);
      return newX;

    } else if (command === 'mouse_position') {
      return `${x},${y}`;
    }


  } else if (command.startsWith('draw_')) {
    if (command === 'draw_rectangle') {
      const [length, width] = rest;
      drawRectangle(width, length);
      return `${length} ${width}`;

    } else if (command === 'draw_square') {
      const [width] = rest;
      drawRectangle(width);
      return width;

    } else if (command === 'draw_circle') {
      const [radius] = rest;
      dragCircle(radius);
      return radius;

    }
  } else {
    return drawImage();
  }

  return '';
}


const drawRectangle = (width: number, length: number = width): void => {
  const { x, y } = robot.getMousePos();

  robot.mouseToggle('down');

  robot.moveMouseSmooth(x + length, y);
  robot.moveMouseSmooth(x + length, y + width);
  robot.moveMouseSmooth(x, y + width);
  robot.moveMouseSmooth(x, y);

  robot.mouseToggle('up');
};

const dragCircle = (radius: number): void => {
  const { x, y } = robot.getMousePos();
  const step = 0.01 * Math.PI;

  robot.mouseToggle('down');

  for (let i = 0; i <= Math.PI * 2; i += step) {
    const newX = x - radius + (radius * Math.cos(i));
    const newY = y + (radius * Math.sin(i));

    robot.dragMouse(newX, newY);
  }

  robot.mouseToggle('up');
};


const drawImage = async (): Promise<string> => {
  const IMAGE_SIZE = 200;
  const offset = IMAGE_SIZE / 2;
  const { x, y } = robot.getMousePos();

  const {
    image,
    width,
    height
  } = robot.screen.capture(x - offset, y - offset, IMAGE_SIZE, IMAGE_SIZE);

  // Support for higher density screens.
  const multi = width / IMAGE_SIZE;

  const jimp = new Jimp(width, height);
  jimp.bitmap.data = image;

  for (let i = 0; i < image.length; i += 4) {
    [image[i], image[i + 2]] = [image[i + 2], image[i]];
    // image[i + 3] = 255 // alpha
  }

  const base64 = await jimp.getBase64Async(jimp.getMIME());

  return `${base64.split(',').pop()}`;
};
