import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MockPaymentDialog from '../components/checkout/MockPaymentDialog';
import { FREE_SHIPPING_MIN, formatPrice } from '../config/catalog';
import { useCart } from '../context/CartContext';
import { useRegions } from '../hooks/useRegions';
import { apiEnabled } from '../services/api';
import { confirmMockPayment, fetchOrder, placeOrder } from '../services/orders';
import { payWithSnap } from '../services/payment';

// Same rules as Laravel (config/services.php → shop); the server has the final say.
const SHIPPING = [
  { id: 'regular', label: 'Regular (2–4 days)', cost: 20000, freeOver: FREE_SHIPPING_MIN },
  { id: 'express', label: 'Express (1 day)', cost: 45000 },
];

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', provinceId: '', province: '', city: '', postalCode: '' };

// Laravel field names → our form field names (for server-side validation messages).
const SERVER_FIELDS = {
  'customer.name': 'name',
  'customer.email': 'email',
  'customer.phone': 'phone',
  'customer.address': 'address',
  'customer.city': 'city',
  'customer.postal_code': 'postalCode',
};

function validate(form, needsProvince) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Please enter a valid email.';
  if (!/^(\+62|0)8\d{7,12}$/.test(form.phone.replace(/[\s-]/g, ''))) errors.phone = 'Use an Indonesian mobile number, e.g. 0812…';
  if (form.address.trim().length < 8) errors.address = 'Please enter your street address.';
  if (needsProvince && !form.provinceId) errors.provinceId = 'Please choose your province.';
  if (form.city.trim().length < 2) errors.city = needsProvince ? 'Please choose your city.' : 'Please enter your city.';
  if (!/^\d{5}$/.test(form.postalCode)) errors.postalCode = 'Postal code has 5 digits.';
  return errors;
}

export default function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [shippingId, setShippingId] = useState('regular');
  const [pendingOrder, setPendingOrder] = useState(null); // order shown in the mock payment sheet
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState('');
  const regions = useRegions(form.provinceId);

  const shipping = SHIPPING.find((s) => s.id === shippingId);
  const shippingCost = shipping.freeOver && cart.subtotal >= shipping.freeOver ? 0 : shipping.cost;
  const total = cart.subtotal + shippingCost;

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const chooseProvince = (event) => {
    const province = regions.provinces.find((p) => p.id === event.target.value);
    setForm((prev) => ({ ...prev, provinceId: event.target.value, province: province?.name ?? '', city: '' }));
    setErrors((prev) => ({ ...prev, provinceId: undefined, city: undefined }));
  };

  // Payment finished → show the order page (it re-reads the status from the server).
  const finish = async (order, status) => {
    setPendingOrder(null);
    if (status === 'paid' || status === 'pending') cart.clear();
    navigate('/orders/' + order.id, { state: { justPaid: status } });
  };

  const onMockResult = async (status) => {
    try {
      await confirmMockPayment(pendingOrder.id, status);
      finish(pendingOrder, status);
    } catch (error) {
      setPendingOrder(null);
      setPayError(error.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate(form, regions.enabled);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.querySelector('.field.has-error input, .field.has-error select')?.focus();
      return;
    }

    setBusy(true);
    setPayError('');
    try {
      const { order, payment } = await placeOrder({
        customer: form,
        shipping: { id: shipping.id, label: shipping.label, cost: shippingCost },
        items: cart.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          color: item.color,
          size: item.size,
          price: item.product.price,
          qty: item.qty,
        })),
        subtotal: cart.subtotal,
        total,
      });

      if (payment.mode === 'midtrans') {
        const status = await payWithSnap(payment.token, payment.clientKey);
        await fetchOrder(order.id, { sync: true }).catch(() => null); // let Laravel confirm with Midtrans
        finish(order, status);
      } else {
        setPendingOrder(order);
      }
    } catch (error) {
      // Show Laravel's validation messages next to the right fields.
      const fieldErrors = {};
      Object.entries(error.errors ?? {}).forEach(([key, messages]) => {
        if (SERVER_FIELDS[key]) fieldErrors[SERVER_FIELDS[key]] = messages[0];
      });
      setErrors(fieldErrors);
      const itemError = Object.entries(error.errors ?? {}).find(([key]) => key.startsWith('items'));
      setPayError(itemError ? itemError[1][0] : error.message);
    } finally {
      setBusy(false);
    }
  };

  if (cart.items.length === 0 && !pendingOrder) {
    return (
      <main className="checkout checkout--empty">
        <h1>Your cart is empty</h1>
        <p>Pick a few pieces first, then come back to check out.</p>
        <Link to="/shop/t-shirts" className="btn btn--dark">
          Browse the shop
        </Link>
      </main>
    );
  }

  const field = (name, label, props = {}) => (
    <label className={'field' + (errors[name] ? ' has-error' : '')}>
      <span>{label}</span>
      <input value={form[name]} onChange={(e) => setField(name, e.target.value)} aria-invalid={Boolean(errors[name])} {...props} />
      {errors[name] && <small>{errors[name]}</small>}
    </label>
  );

  const select = (name, label, value, onChange, options, placeholder, disabled = false) => (
    <label className={'field' + (errors[name] ? ' has-error' : '')}>
      <span>{label}</span>
      <select value={value} onChange={onChange} disabled={disabled} aria-invalid={Boolean(errors[name])}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.value ?? o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {errors[name] && <small>{errors[name]}</small>}
    </label>
  );

  return (
    <main className="checkout">
      <form className="checkout__form" onSubmit={submit} noValidate>
        <h1>Checkout</h1>

        <section className="checkout__card">
          <h2>Contact</h2>
          {field('name', 'Full name', { autoComplete: 'name' })}
          <div className="field-row">
            {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
            {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '0812…' })}
          </div>
        </section>

        <section className="checkout__card">
          <h2>Shipping address</h2>
          {field('address', 'Street address', { autoComplete: 'street-address' })}
          {regions.enabled ? (
            <>
              <div className="field-row">
                {select('provinceId', 'Province', form.provinceId, chooseProvince, regions.provinces, 'Choose province…')}
                {select(
                  'city',
                  'City',
                  form.city,
                  (e) => setField('city', e.target.value),
                  regions.cities.map((c) => ({ ...c, value: c.name })),
                  form.provinceId ? 'Choose city…' : 'Choose a province first',
                  !form.provinceId
                )}
              </div>
              {field('postalCode', 'Postal code', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 5 })}
            </>
          ) : (
            <div className="field-row">
              {field('city', 'City', { autoComplete: 'address-level2' })}
              {field('postalCode', 'Postal code', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 5 })}
            </div>
          )}
          {regions.error && <p className="checkout__pay-note">{regions.error}</p>}
        </section>

        <section className="checkout__card">
          <h2>Delivery</h2>
          {SHIPPING.map((option) => {
            const free = option.freeOver && cart.subtotal >= option.freeOver;
            return (
              <label key={option.id} className={'ship' + (option.id === shippingId ? ' is-active' : '')}>
                <input
                  type="radio"
                  name="shipping"
                  value={option.id}
                  checked={option.id === shippingId}
                  onChange={() => setShippingId(option.id)}
                />
                <span>{option.label}</span>
                <strong>{free ? 'Free' : formatPrice(option.cost)}</strong>
              </label>
            );
          })}
        </section>

        <section className="checkout__card">
          <h2>Payment</h2>
          <p className="checkout__pay-note">
            {apiEnabled
              ? 'Pay with Midtrans: virtual account, QRIS, e-wallet or card. Without Midtrans keys the server runs in sandbox mock mode.'
              : 'Demo mode (no backend): the payment is simulated in your browser.'}
          </p>
          {payError && (
            <p className="checkout__error" role="alert">
              {payError}
            </p>
          )}
          <button type="submit" className="btn btn--dark btn--block btn--lg" disabled={busy}>
            {busy ? 'Placing order…' : 'Pay ' + formatPrice(total)}
          </button>
        </section>
      </form>

      <aside className="checkout__summary">
        <h2>Order summary</h2>
        <ul>
          {cart.items.map((item) => (
            <li key={item.key} className="sum-line">
              <span className="sum-line__media">
                <img src={item.image} alt="" />
                <em>{item.qty}</em>
              </span>
              <span className="sum-line__name">
                {item.name}
                <small>
                  {item.color} · {item.size}
                </small>
              </span>
              <strong>{formatPrice(item.lineTotal)}</strong>
            </li>
          ))}
        </ul>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(cart.subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</dd>
          </div>
          <div className="is-total">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </aside>

      {pendingOrder && <MockPaymentDialog order={pendingOrder} onResult={onMockResult} />}
    </main>
  );
}
