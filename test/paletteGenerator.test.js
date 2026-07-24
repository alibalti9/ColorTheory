import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePalette } from '../js/paletteGenerator.js';
import { generateInterpolationRamp } from '../js/paletteInterpolation.js';
import { autoFixWcagTextColor, wcagContrastRatio } from '../js/contrastEngine.js';
import { findClosestColorName } from '../js/color-name-database.js';
import { getSemanticRoleSuggestions } from '../js/palette-utils.js';
import { getColorTemperature } from '../js/palette-utils.js';
import { initialState } from '../js/stateManager.js';

test('generatePalette respects locked slots', () => {
  const palette = generatePalette('#ff6600', 5, 'Complementary', {
    lockedSlots: [0, 4],
    lockedColors: ['#ff6600', '#00aaff']
  });

  assert.equal(palette[0], '#ff6600');
  assert.equal(palette[4], '#00aaff');
  assert.equal(palette.length, 5);
});

test('generateInterpolationRamp creates evenly spaced colors', () => {
  const ramp = generateInterpolationRamp('#ff0000', '#0000ff', 5);
  assert.equal(ramp.length, 5);
  assert.equal(ramp[0], '#ff0000');
  assert.equal(ramp[4], '#0000ff');
  assert.deepEqual(ramp, ['#ff0000', '#bf0040', '#800080', '#4000bf', '#0000ff']);
});

test('autoFixWcagTextColor returns an AA-safe text color', () => {
  const fixed = autoFixWcagTextColor('#777777', '#ffffff');
  assert.ok(wcagContrastRatio(fixed, '#ffffff') >= 4.51);
});

test('color names use the Crayola nearest-match database', () => {
  assert.equal(findClosestColorName('#000000').name, 'Black');
  assert.equal(findClosestColorName('#ffffff').name, 'White');
  assert.equal(findClosestColorName('#ee204d').name, 'Red');
});

test('semantic role suggestions include foundational UI roles', () => {
  const roles = getSemanticRoleSuggestions(['#121212', '#f7f7f7', '#6750a4', '#03dac6', '#ffb4ab']);
  assert.ok(roles.flat().includes('Background'));
  assert.ok(roles.flat().includes('Text'));
  assert.ok(roles.flat().includes('Primary'));
  assert.ok(roles.flat().includes('Accent'));
});

test('color temperature classifies warm, cool, and neutral colors', () => {
  assert.equal(getColorTemperature('#ff5a36').label, 'Warm');
  assert.equal(getColorTemperature('#3488ff').label, 'Cool');
  assert.equal(getColorTemperature('#808080').label, 'Neutral');
});

test('state starts with an empty palette version history', () => {
  assert.deepEqual(initialState.paletteHistory, []);
});
