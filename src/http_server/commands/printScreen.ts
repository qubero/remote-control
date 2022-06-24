import Jimp from 'jimp';
import robot from 'robotjs';
import { ICoords } from '../../..';

const IMAGE_SIZE = 200;
const OFFSET = IMAGE_SIZE / 2;

const printScreen = async ({ x, y }: ICoords): Promise<string> => {
  const {
    image,
    width,
    height
  } = robot.screen.capture(x - OFFSET, y - OFFSET, IMAGE_SIZE, IMAGE_SIZE);

  // Support for higher density screens.
  const multi = width / IMAGE_SIZE;

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
