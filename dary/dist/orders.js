export const ORDERS_KEY = 'dary-orders';

export function createOrder({ id, customer, items, total, createdAt = new Date().toISOString() }) {
  if (!id || !customer?.name || !customer?.email || !customer?.phone || !customer?.address) {
    throw new Error('بيانات الطلب غير مكتملة');
  }
  if (!Array.isArray(items) || items.length === 0 || !Number.isFinite(total) || total <= 0) {
    throw new Error('السلة فارغة أو المجموع غير صالح');
  }
  return {
    id,
    customer: { name: customer.name.trim(), email: customer.email.trim().toLowerCase(), phone: customer.phone.trim(), address: customer.address.trim() },
    items: items.map(({ id: productId, name, quantity, price }) => ({ id: productId, name, quantity, price })),
    total,
    paymentMethod: 'cash-on-delivery',
    status: 'awaiting-seller',
    createdAt,
    acceptedBy: null,
  };
}

export function acceptOrder(orders, orderId, sellerEmail) {
  const target = orders.find((order) => order.id === orderId);
  if (!target || target.status !== 'awaiting-seller') return orders;
  return orders.map((order) => order.id === orderId
    ? { ...order, status: 'accepted', acceptedBy: sellerEmail.trim().toLowerCase() }
    : order);
}

export function cancelOrder(orders, orderId, customerEmail) {
  const target = orders.find((order) => order.id === orderId);
  if (!target || target.status !== 'awaiting-seller' || target.customer.email !== customerEmail.trim().toLowerCase()) return orders;
  return orders.map((order) => order.id === orderId ? { ...order, status: 'cancelled' } : order);
}
