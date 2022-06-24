import { httpServer } from './src/http_server/index';
import robot from 'robotjs';
import { createWebSocketStream, WebSocketServer } from 'ws';
import type { DuplexOptions } from 'stream';
import { RCcommmands } from './src/commands';
import { ICommandFn, RCcommand } from './src/commands/interfaces';

const HTTP_PORT = Number(process.env.HTTP_PORT) || 3000;
const WSS_PORT = Number(process.env.WSS_PORT) || 8080;

httpServer.listen(HTTP_PORT)
  .on('listening', () => console.log(`Start static http server on the ${HTTP_PORT} port!`));

const wss = new WebSocketServer({ port: WSS_PORT });

wss.on('listening', () => console.log(`Start web socket server on the ${WSS_PORT} port!`));

wss.on('headers', () => {
  console.log('New connection');
});

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

    if (!command) return;

    try {
      if (!RCcommmands.hasOwnProperty(command)) {
        throw new Error(`${command} is not supported.`);
      }

      const coords = robot.getMousePos();
      const cmd: ICommandFn = RCcommmands[command as RCcommand];
      const result = await cmd(coords, args.map((arg) => Number(arg) || 0));

      duplex.write(`${command} ${result}\0`, () => {
        console.log(`'${command}' Done!`);
      });
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.name + ': ' + err.message);
      }
    }
  });

  duplex.on('end', () => console.log('There will be no more data.'));

  ws.on('close', () => duplex.destroy());
});

process.on('SIGINT', () => {
  httpServer.close();
  wss.close();
  console.log('Bye-bye');
  process.exit();
});
