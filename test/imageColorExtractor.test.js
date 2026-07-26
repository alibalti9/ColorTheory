import test from 'node:test';
import assert from 'node:assert/strict';
import {
  kMeansCluster,
  mergeSimilarColors,
  clustersToHex,
  samplePixels
} from '../js/imageColorExtractor.js';

test('kMeansCluster groups similar colors', () => {
  const redPixels = Array.from({ length: 40 }, () => [220, 30, 30]);
  const bluePixels = Array.from({ length: 40 }, () => [30, 60, 220]);
  const clusters = kMeansCluster([...redPixels, ...bluePixels], 2);

  assert.equal(clusters.length, 2);
  const hexes = clustersToHex(clusters);
  assert.ok(hexes.some((hex) => hex.startsWith('#D') || hex.startsWith('#E') || hex.startsWith('#C')));
  assert.ok(hexes.some((hex) => hex.startsWith('#1') || hex.startsWith('#2') || hex.startsWith('#3')));
});

test('mergeSimilarColors combines near-duplicate clusters', () => {
  const merged = mergeSimilarColors([
    { rgb: [200, 50, 50], count: 30 },
    { rgb: [202, 52, 48], count: 20 },
    { rgb: [40, 80, 200], count: 25 }
  ]);

  assert.equal(merged.length, 2);
  assert.equal(merged[0].count, 50);
});

test('samplePixels skips transparent pixels', () => {
  const canvas = {
    width: 2,
    height: 1,
    getContext: () => ({
      getImageData: () => ({
        width: 2,
        height: 1,
        data: new Uint8ClampedArray([
          255, 0, 0, 255,
          0, 255, 0, 0
        ])
      })
    })
  };

  const pixels = samplePixels(canvas);
  assert.equal(pixels.length, 1);
  assert.deepEqual(pixels[0], [255, 0, 0]);
});
