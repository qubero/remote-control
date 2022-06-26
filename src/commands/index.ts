import robot from 'robotjs';
import { drawCircle } from "./drawCircle";
import { drawRect } from "./drawRect";
import { ICommandFn, RCcommand } from "./interfaces";
import { printScreen } from "./printScreen";

export const { width: X_MAX, height: Y_MAX } = robot.getScreenSize();
export const X_MIN = 0;
export const Y_MIN = 0;

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
    if (width !== 0 && length !== 0) drawRect(coords, width, length);
    return Promise.resolve(`${length} ${width}`);
  },
  draw_square: (coords, [width]) => {
    if (width !== 0) drawRect(coords, width);
    return Promise.resolve(width);
  },
  draw_circle: (coords, [radius]) => {
    if (radius !== 0) drawCircle(coords, radius);
    return Promise.resolve(radius);
  },
  prnt_scrn: printScreen,
};

export { RCcommmands };
