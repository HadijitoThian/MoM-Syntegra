// Thin Midtrans Snap client. Production uses app.midtrans.com; sandbox uses
// app.sandbox.midtrans.com. Toggle by setting MIDTRANS_PRODUCTION=true.
import crypto from 'node:crypto';

const SANDBOX = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const PROD = 'https://app.midtrans.com/snap/v1/transactions';

export const PLAN_AMOUNT_IDR = 79000;
export const TOPUP_AMOUNT_IDR = 25000;
export const TOPUP_MINUTES = 300;

function endpoint() {
  return process.env.MIDTRANS_PRODUCTION === 'true' ? PROD : SANDBOX;
}

function authHeader() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error('MIDTRANS_SERVER_KEY not configured');
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64');
}

async function snapPost(payload) {
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`midtrans_create_failed_${res.status}: ${body}`);
  }
  return res.json();
}

export function createSnapTransaction({ orderId, user }) {
  return snapPost({
    transaction_details: { order_id: orderId, gross_amount: PLAN_AMOUNT_IDR },
    item_details: [{
      id: 'mom-monthly',
      name: 'Syntegra MoM — 1 bulan (750 menit)',
      price: PLAN_AMOUNT_IDR,
      quantity: 1,
    }],
    customer_details: { email: user.email, first_name: user.full_name || user.email },
    callbacks: { finish: `${process.env.PUBLIC_URL}/subscribe?status=finish` },
  });
}

export function createTopupTransaction({ orderId, user }) {
  return snapPost({
    transaction_details: { order_id: orderId, gross_amount: TOPUP_AMOUNT_IDR },
    item_details: [{
      id: 'mom-topup-300',
      name: `Syntegra MoM — Topup ${TOPUP_MINUTES} menit`,
      price: TOPUP_AMOUNT_IDR,
      quantity: 1,
    }],
    customer_details: { email: user.email, first_name: user.full_name || user.email },
    callbacks: { finish: `${process.env.PUBLIC_URL}/settings?topup=finish` },
  });
}

// Midtrans webhook signature: sha512(order_id + status_code + gross_amount + server_key)
export function verifySignature({ order_id, status_code, gross_amount, signature_key }) {
  const expected = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest('hex');
  return expected === signature_key;
}

export function isPaidStatus(transaction_status, fraud_status) {
  if (transaction_status === 'capture') return fraud_status === 'accept';
  return transaction_status === 'settlement';
}
