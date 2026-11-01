/*
 * Payment gateway: Midtrans Snap (sandbox).
 *
 * Flow with the Laravel backend:
 *   1. POST /api/checkout → Laravel creates the order and, with the SECRET server
 *      key, asks Midtrans for a Snap token → returns { token, client_key }
 *   2. We open the Snap popup with that token (window.snap.pay)
 *   3. Midtrans calls the Laravel webhook → order paid → stock out → n8n notifies
 *
 * When Laravel has no Midtrans keys yet it answers with mode "mock", and the
 * checkout shows a simulated payment sheet instead (allowed by the brief).
 */

const SNAP_URL = 'https://app.sandbox.midtrans.com/snap/snap.js';

let snapLoading = null;

function loadSnap(clientKey) {
  if (window.snap) return Promise.resolve();
  if (!snapLoading) {
    snapLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SNAP_URL;
      script.setAttribute('data-client-key', clientKey);
      script.onload = resolve;
      script.onerror = () => {
        snapLoading = null;
        reject(new Error('Could not load Midtrans Snap.'));
      };
      document.head.appendChild(script);
    });
  }
  return snapLoading;
}

/**
 * Open the Snap popup. Resolves with 'paid' | 'pending' | 'failed' | 'cancelled'.
 */
export async function payWithSnap(token, clientKey) {
  if (!clientKey) {
    throw new Error('Payment is not fully set up yet (Midtrans client key missing). Please try again later.');
  }
  await loadSnap(clientKey);
  return new Promise((resolve) => {
    window.snap.pay(token, {
      onSuccess: () => resolve('paid'),
      onPending: () => resolve('pending'),
      onError: () => resolve('failed'),
      onClose: () => resolve('cancelled'),
    });
  });
}
