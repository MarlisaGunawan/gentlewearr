/*
 * Orders. With the Laravel API they live in the database (the ERP backoffice
 * reads them); without it they are kept in this browser so the demo still works.
 * Both paths return the same order shape to the pages.
 */
import { api, apiEnabled } from './api';

const STORAGE_KEY = 'gw-orders';
const memory = {}; // fallback when browser storage is blocked

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveLocal(order) {
  memory[order.id] = order;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readAll(), [order.id]: order }));
  } catch {
    // storage blocked — kept in memory for this visit
  }
}

/** API order → page shape. */
function fromApi(o) {
  return {
    id: o.code,
    status: o.status,
    createdAt: o.created_at,
    customer: {
      name: o.customer.name,
      email: o.customer.email,
      phone: o.customer.phone,
      address: o.customer.address,
      city: o.customer.city,
      province: o.customer.province,
      postalCode: o.customer.postal_code,
    },
    items: o.items.map((i) => ({ productId: i.sku, name: i.name, image: i.image, color: i.color, size: i.size, price: i.price, qty: i.qty })),
    subtotal: o.subtotal,
    shippingLabel: o.shipping.label,
    shippingCost: o.shipping.cost,
    total: o.total,
    trackingNumber: o.tracking_number,
  };
}

/**
 * Create the order. `draft` = { customer, shipping: {id, label, cost}, items, subtotal, total }.
 * Returns { order, payment: { mode: 'midtrans' | 'mock', token, clientKey } }.
 */
export async function placeOrder(draft) {
  if (apiEnabled) {
    const res = await api('/checkout', {
      method: 'POST',
      body: {
        customer: {
          name: draft.customer.name,
          email: draft.customer.email,
          phone: draft.customer.phone.replace(/[\s-]/g, ''),
          address: draft.customer.address,
          province: draft.customer.province,
          city: draft.customer.city,
          postal_code: draft.customer.postalCode,
        },
        shipping: draft.shipping.id,
        items: draft.items.map((i) => ({ sku: i.productId, color: i.color, size: i.size, qty: i.qty })),
      },
    });
    return {
      order: fromApi(res.order),
      payment: { mode: res.payment.mode, token: res.payment.token, clientKey: res.payment.client_key },
    };
  }

  const order = {
    id: 'GW-' + Date.now().toString(36).toUpperCase(),
    status: 'waiting_payment',
    createdAt: new Date().toISOString(),
    customer: draft.customer,
    items: draft.items,
    subtotal: draft.subtotal,
    shippingLabel: draft.shipping.label,
    shippingCost: draft.shipping.cost,
    total: draft.total,
  };
  saveLocal(order);
  return { order, payment: { mode: 'mock' } };
}

/** Result of the simulated payment sheet. */
export async function confirmMockPayment(orderId, status) {
  if (apiEnabled) {
    await api('/orders/' + orderId + '/mock-pay', { method: 'POST', body: { status } });
    return;
  }
  const order = memory[orderId] ?? readAll()[orderId];
  if (order) saveLocal({ ...order, status });
}

/** Load an order. `sync` asks Laravel to double-check the status with Midtrans. */
export async function fetchOrder(orderId, { sync = false } = {}) {
  if (apiEnabled) {
    const res = await api('/orders/' + encodeURIComponent(orderId) + (sync ? '?sync=1' : ''));
    return fromApi(res.data);
  }
  return memory[orderId] ?? readAll()[orderId] ?? null;
}
