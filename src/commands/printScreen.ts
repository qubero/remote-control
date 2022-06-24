import Jimp from 'jimp';
import robot from 'robotjs';
import { X_MAX, X_MIN, Y_MAX, Y_MIN } from '.';
import { ICoords } from './interfaces';

const IMAGE_SIZE = 200;
const OFFSET = IMAGE_SIZE / 2;

const printScreen = async ({ x, y }: ICoords): Promise<string> => {
  let newX = x - OFFSET,
      newY = y - OFFSET;

  if (newX < X_MIN) newX = X_MIN;
  if (newY < Y_MIN) newY = Y_MIN;

  if (newX + IMAGE_SIZE > X_MAX) newX = X_MAX - IMAGE_SIZE;
  if (newY + IMAGE_SIZE > Y_MAX) newY = Y_MAX - IMAGE_SIZE;

  const {
    image,
    width,
    height
  } = robot.screen.capture(newX, newY, IMAGE_SIZE, IMAGE_SIZE);

  // const multi = width / IMAGE_SIZE; // Support for higher density screens

  const jimp = new Jimp(width, height);
  jimp.bitmap.data = image;

  for (let i = 0; i < image.length; i += 4) {
    [image[i], image[i + 2]] = [image[i + 2], image[i]];
    // image[i + 3] = 255 // alpha
  }

  const base64 = await jimp.getBase64Async(jimp.getMIME());

  return `${base64.split(',').pop()}`
};

export { printScreen };
