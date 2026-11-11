import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptOrder, cancelOrder, createOrder } from '../orders.js';

const valid = {
  id: 'DARY-123456',
  customer: { name: '  محمد  ', email: 'BUYER@example.com', phone: '0600000000', address: 'طانطان، الحي الجديد' },
  items: [{ id: 'meal-1', name: 'طاجين', quantity: 2, price: 40 }],
  total: 80,
  createdAt: '2026-11-11T00:00:00.000Z',
};

test('creates a complete cash-on-delivery order waiting for a seller', () => {
  assert.deepEqual(createOrder(valid), {
    id: 'DARY-123456',
    customer: { name: 'محمد', email: 'buyer@example.com', phone: '0600000000', address: 'طانطان، الحي الجديد' },
    items: [{ id: 'meal-1', name: 'طاجين', quantity: 2, price: 40 }],
    total: 80,
    paymentMethod: 'cash-on-delivery',
    status: 'awaiting-seller',
    createdAt: '2026-11-11T00:00:00.000Z',
    acceptedBy: null,
  });
});

test('rejects incomplete customer or empty cart details', () => {
  assert.throws(() => createOrder({ ...valid, customer: { ...valid.customer, address: '' } }));
  assert.throws(() => createOrder({ ...valid, items: [] }));
});

test('allows one seller to accept an order only once', () => {
  const order = createOrder(valid);
  const accepted = acceptOrder([order], order.id, 'SELLER@example.com');
  assert.equal(accepted[0].status, 'accepted');
  assert.equal(accepted[0].acceptedBy, 'seller@example.com');
  assert.equal(acceptOrder(accepted, order.id, 'second@example.com'), accepted);
});

test('lets only its buyer cancel a not-yet-accepted order', () => {
  const order = createOrder(valid);
  const cancelled = cancelOrder([order], order.id, 'buyer@example.com');
  assert.equal(cancelled[0].status, 'cancelled');
  const pending = [order];
  assert.equal(cancelOrder(pending, order.id, 'other@example.com'), pending);
  assert.equal(cancelOrder(acceptOrder([order], order.id, 'seller@example.com'), order.id, 'buyer@example.com')[0].status, 'accepted');
});
