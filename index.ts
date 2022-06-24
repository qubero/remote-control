import { httpServer } from './src/http_server/index';
import robot from 'robotjs';
import { createWebSocketStream, WebSocketServer } from 'ws';
import type { DuplexOptions } from 'stream';
import { drawRect } from './src/http_server/commands/drawRect';
import { drawCircle } from './src/http_server/commands/drawCircle';
import { printScreen } from './src/http_server/commands/printScreen';

const HTTP_PORT = Number(process.env.HTTP_PORT) || 3000;
const WSS_PORT = Number(process.env.WSS_PORT) || 8080;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: WSS_PORT });

const { width: X_MAX, height: Y_MAX } = robot.getScreenSize();
const X_MIN = 0;
const Y_MIN = 0;

export interface ICoords {
  x: number,
  y: number,
}

export interface ICommandFn {
  (coords: ICoords, args: Array<number>): Promise<number | string>;
}
type RCcommand = 'mouse_up' | 'mouse_down' | 'mouse_left' | 'mouse_right' | 'mouse_position' | 'draw_circle' | 'draw_rectangle' | 'draw_square' | 'prnt_scrn';


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

    try {
      const coords = robot.getMousePos();
      const cmd = RCcommmands[command as RCcommand];

      const result = await cmd(coords, args.map(Number));
      duplex.write(`${command} ${result}`, () => { console.log(`'${command}' Done!`) });
    } catch (err) {
      console.error('');
    }
  });

  duplex.on('end', () => console.log('There will be no more data.'));
  ws.on('close', () => duplex.destroy());
});

const RCcommmands: Record<RCcommand, ICommandFn> = {
  mouse_up: ({ x, y }, [offset]) => {
    const newY = (y - offset) < Y_MIN ? Y_MIN : (y - offset);
    robot.moveMouse(x, newY);
    return Promise.resolve(newY);
  },
  mouse_down: ({ x, y }, [offset]) => {
    const newY = (y + offset) > Y_MAX ? Y_MAX : (y + offset);
    robot.moveMouse(x, newY);
    return Promise.resolve(newY);
  },
  mouse_left: ({ x, y }, [offset]) => {
    const newX = (x - offset) < X_MIN ? X_MIN : (x - offset);
    robot.moveMouse(newX, y);
    return Promise.resolve(newX);
  },
  mouse_right: ({ x, y }, [offset]) => {
    const newX = (x + offset) > X_MAX ? X_MAX : (x + offset);
    robot.moveMouse(newX, y);
    return Promise.resolve(newX);
  },
  mouse_position: ({ x, y }) => {
    return Promise.resolve(`${x},${y}`);
  },
  draw_rectangle: (coords, [length, width]) => {
    drawRect(coords, width, length);
    return Promise.resolve(`${length} ${width}`);
  },
  draw_square: (coords, [width]) => {
    drawRect(coords, width);
    return Promise.resolve(width);
  },
  draw_circle: (coords, [radius]) => {
    drawCircle(coords, radius);
    return Promise.resolve(radius);
  },
  prnt_scrn: printScreen,
};
