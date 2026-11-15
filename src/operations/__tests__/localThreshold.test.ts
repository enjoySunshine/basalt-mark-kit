import { expect, test } from 'vitest';

import { Image } from '../../Image.ts';
import { ImageColorModel } from '../../utils/constants/colorModels.ts';
import { localThreshold } from '../localThreshold.ts';

test('a faint pixel next to an even fainter one is kept', () => {
  const image = testUtils.createGreyImage([
    [4, 10, 0],
    [10, 10, 0],
    [0, 0, 0],
  ]);

  const mask = localThreshold(image);

  expect(mask).toMatchMaskData([
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 0],
  ]);
});

test('the centre of a 3x3 image only looks at its neighbours', () => {
  const image = testUtils.createGreyImage([
    [20, 1, 20],
    [1, 4, 1],
    [20, 1, 20],
  ]);

  const mask = image.localThreshold();

  expect(mask).toMatchMaskData([
    [1, 0, 1],
    [0, 0, 0],
    [1, 0, 1],
  ]);
});

test('a pixel is compared with its two horizontal neighbours', () => {
  const image = testUtils.createGreyImage([[0, 30, 0]]);

  const mask = localThreshold(image);

  expect(mask).toMatchMaskData([[0, 1, 0]]);
});

test('uniform pixels are not ink', () => {
  const image = testUtils.createGreyImage([
    [10, 10, 10],
    [10, 10, 10],
  ]);

  expect(localThreshold(image)).toMatchMaskData([
    [0, 0, 0],
    [0, 0, 0],
  ]);
});

test('diagonal neighbours are taken into account', () => {
  const image = testUtils.createGreyImage([
    [0, 0, 0],
    [0, 10, 0],
    [0, 0, 0],
  ]);

  expect(image.localThreshold()).toMatchMaskData([
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ]);
});

test('neighbours out of the image are ignored', () => {
  // The top-left pixel has three neighbours whose mean is 10. Were the
  // missing neighbours counted as zero in the mean, it would become ink.
  const image = testUtils.createGreyImage([
    [5, 10],
    [10, 10],
  ]);

  expect(image.localThreshold()).toMatchMaskData([
    [0, 1],
    [1, 1],
  ]);
});

test('a 1x1 image has no neighbour and is not ink', () => {
  const image = testUtils.createGreyImage([[255]]);

  expect(image.localThreshold()).toMatchMaskData([[0]]);
});

test('the input image is not modified', () => {
  const image = testUtils.createGreyImage([
    [4, 10, 0],
    [10, 10, 0],
    [0, 0, 0],
  ]);

  localThreshold(image);

  expect(image).toMatchImageData([
    [4, 10, 0],
    [10, 10, 0],
    [0, 0, 0],
  ]);
});

test('16 bits image', () => {
  const image = new Image(3, 1, {
    colorModel: ImageColorModel.GREY,
    bitDepth: 16,
    data: new Uint16Array([0, 30000, 0]),
  });

  expect(localThreshold(image)).toMatchMaskData([[0, 1, 0]]);
});

test('error too many channels', () => {
  const image = testUtils.createRgbImage([[0, 0, 0, 255, 255, 255]]);

  expect(() => localThreshold(image)).toThrow(
    /threshold can only be computed on images with one channel/,
  );
});

test('the local mode is available through threshold()', () => {
  const image = testUtils.createGreyImage([
    [4, 10, 0],
    [10, 10, 0],
    [0, 0, 0],
  ]);

  expect(image.threshold({ local: true })).toMatchMaskData([
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 0],
  ]);
});

test('threshold() keeps using a single threshold by default', () => {
  const image = testUtils.createGreyImage([
    [4, 10, 0],
    [10, 10, 0],
    [0, 0, 0],
  ]);

  expect(image.threshold({ threshold: 0.5 / 255 })).toMatchMaskData([
    [1, 1, 0],
    [1, 1, 0],
    [0, 0, 0],
  ]);
});

test('out option', () => {
  const image = testUtils.createGreyImage([[0, 30, 0]]);
  const out = testUtils.createMask([[1, 1, 1]]);

  const mask = localThreshold(image, { out });

  expect(mask).toBe(out);
  expect(mask).toMatchMaskData([[0, 1, 0]]);
});
