import test from 'node:test';
import assert from 'node:assert/strict';
import { toPaise } from '../src/amount.js';

test('converts rupees to integer paise', () => {
  assert.equal(toPaise('1'), 100);
  assert.equal(toPaise('1000'), 100000);
  assert.equal(toPaise('12.5'), 1250);
  assert.equal(toPaise('12.05'), 1205);
});

test('rejects invalid or unsafe money input', () => {
  for (const value of ['', '0', '0.00', '-1', '1.234', '1,000', 'abc', '90071992547409.92']) {
    assert.equal(toPaise(value), null, `expected ${value} to be rejected`);
  }
});
