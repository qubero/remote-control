import robot from 'robotjs';
import { ICoords } from './interfaces';

const STEP = 0.01 * Math.PI;

const drawCircle = ({ x, y }: ICoords, radius: number): void => {
  robot.mouseClick();
  robot.mouseToggle('down');

  for (let i = 0; i <= Math.PI * 2; i += STEP) {
    const newX = x - radius + (radius * Math.cos(i));
    const newY = y + (radius * Math.sin(i));

    robot.dragMouse(newX, newY);
  }

  robot.mouseToggle('up');
};

export { drawCircle };
