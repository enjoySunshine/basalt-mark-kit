import type { Image } from '../Image.ts';
import type { Mask } from '../Mask.ts';
import { imageToOutputMask } from '../utils/getOutputImage.ts';
import { surroundingPixels } from '../utils/surroundingPixels.ts';

export interface LocalThresholdOptions {
  /**
   * Mask in which to put the result.
   */
  out?: Mask;
}

/**
 * Create a mask by comparing every pixel with the pixels that surround it.
 *
 * The threshold is not shared by the whole image: each pixel is compared with
 * the mean of the pixels that touch it, that is its four orthogonal and four
 * diagonal neighbours. Neighbours that fall outside of the image are ignored.
 * A pixel that is strictly higher than this mean is set to 1 (ink), a pixel
 * that is equal to or lower than the mean is set to 0. A pixel without any
 * neighbour (a 1x1 image) is set to 0.
 *
 * This makes it possible to keep a faint pixel that lies next to an even
 * fainter one, whereas a single threshold for the whole image would classify
 * both the same way.
 * @param image - The grey image to convert.
 * @param options - Local threshold options.
 * @returns The resulting mask.
 */
export function localThreshold(
  image: Image,
  options: LocalThresholdOptions = {},
): Mask {
  if (image.channels !== 1) {
    throw new TypeError(
      'threshold can only be computed on images with one channel',
    );
  }
  const result = imageToOutputMask(image, options);
  const { width, height } = image;

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      let sum = 0;
      let count = 0;
      for (const neighbour of surroundingPixels) {
        const neighbourRow = row + neighbour.row;
        const neighbourColumn = column + neighbour.column;
        if (
          neighbourRow < 0 ||
          neighbourRow >= height ||
          neighbourColumn < 0 ||
          neighbourColumn >= width
        ) {
          continue;
        }
        sum += image.getValue(neighbourColumn, neighbourRow, 0);
        count++;
      }
      const value = image.getValue(column, row, 0);
      // Comparing `value * count` with `sum` keeps the comparison exact.
      const isInk = count > 0 && value * count > sum;
      result.setBit(column, row, isInk ? 1 : 0);
    }
  }

  return result;
}

/**
 * Adaptive thresholding with a mean of the surrounding pixels.
 * This is an alias for {@link localThreshold}.
 * @param image - The grey image to convert.
 * @param options - Local threshold options.
 * @returns The resulting mask.
 */
export function adaptiveThreshold(
  image: Image,
  options: LocalThresholdOptions = {},
): Mask {
  return localThreshold(image, options);
}
