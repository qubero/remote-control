import robot from 'robotjs';
import { ICoords } from './interfaces';

const drawRect = ({ x, y }: ICoords,  width: number, length: number = width): void => {
  robot.mouseClick();
  robot.mouseToggle('down');
  robot.moveMouseSmooth(x + length, y);
  robot.moveMouseSmooth(x + length, y + width);
  robot.moveMouseSmooth(x, y + width);
  robot.moveMouseSmooth(x, y);
  robot.mouseToggle('up');
};

export { drawRect };
