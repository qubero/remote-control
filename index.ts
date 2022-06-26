import { httpServer } from './src/http_server/index';
import robot from 'robotjs';
import { createWebSocketStream, WebSocketServer } from 'ws';
import type { DuplexOptions } from 'stream';
import { RCcommmands } from './src/commands';
import { ICommandFn, IWebSocket, RCcommand } from './src/commands/interfaces';
import 'dotenv/config';

const HTTP_PORT = Number(process.env.HTTP_PORT) || 3000;
const WSS_PORT = Number(process.env.WSS_PORT) || 8080;

httpServer.listen(HTTP_PORT)
  .on('listening', () => console.log(`Start static http server on the ${HTTP_PORT} port!`));

const wss = new WebSocketServer({ port: WSS_PORT });
wss.on('listening', () => console.log(`Start web socket server on the ${WSS_PORT} port!\n`));

wss.on('headers', (data) => {
  console.log(data);
});

wss.on('connection', async (ws: IWebSocket) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

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

    if (!command) return;

    try {
      if (!RCcommmands.hasOwnProperty(command)) {
        throw new Error(`${command} is not supported.`);
      }

      const coords = robot.getMousePos();
      const cmd: ICommandFn = RCcommmands[command as RCcommand];
      const result = await cmd(coords, args.map((arg) => Number(arg) || 0));

      duplex.write(`${command} ${result}\0`, () => {
        console.log(`'${command} ${args}' Done!`);
      });
    } catch (err) {
      console.log(`'${command} ${args}' Failed!`);
      if (err instanceof Error) {
        console.error(err.name + ': ' + err.message);
      }
    }
  });

  duplex.on('end', () => {
    console.log('There will be no more data.\n');
  });

  ws.on('close', () => {
    duplex.destroy();
  });
});

process.on('SIGINT', () => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive) ws.terminate();
  });
  wss.close(() => {
    clearInterval(interval);
    console.log('\nStop web socket server.');
  });
  httpServer.close(() => {
    console.log('Stop static http server.');
  });

  process.nextTick(() => {
      process.exit();
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
