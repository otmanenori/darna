import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, filterProducts, calculateSubtotal } from '../catalog.js';

test('shows all products when no category or query is selected', () => {
  assert.equal(filterProducts(PRODUCTS).length, 21);
});

test('keeps the uploaded meals, sweets, and breakfast photos in their categories', () => {
  assert.equal(filterProducts(PRODUCTS, 'حلويات').length, 13);
  assert.equal(filterProducts(PRODUCTS, 'أطباق رئيسية').length, 7);
  assert.equal(filterProducts(PRODUCTS, 'فطور').length, 1);
  assert.equal(filterProducts(PRODUCTS, 'أطباق رئيسية', 'كفتة')[0].id, 'tagine-prune');
  assert.equal(filterProducts(PRODUCTS, 'حلويات', 'تفاح')[0].id, 'apple-tart');
});

test('calculates a cart subtotal and ignores missing products', () => {
  assert.equal(calculateSubtotal({ 'tagine-prune': 2, 'chebakia': 1 }), 171);
  assert.equal(calculateSubtotal({ missing: 4 }), 0);
});
