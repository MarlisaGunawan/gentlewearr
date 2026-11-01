import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { MEDIA_BASE } from '../../config/heroContent';
import { useAdmin } from '../AdminAuth';

/**
 * Backoffice sign-in: a rounded video card on the left (our own fashion clip,
 * brand text laid over it in HTML) and the form on the right.
 */
export default function LoginPage() {
  const { login } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (e) {
      setError(e.errors?.email?.[0] ?? e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="adm-auth">
      <section className="adm-auth__media" aria-hidden="true">
        <video src={MEDIA_BASE + 'video-1.mp4'} autoPlay muted loop playsInline />
        <div className="adm-auth__overlay" />
        <span className="adm-auth__tag">#GentleWear</span>
        <div className="adm-auth__copy">
          <p className="adm-auth__brand">GENTLE WEAR</p>
          <h2>
            Dress with ease,
            <br />
            <em>manage with clarity.</em>
          </h2>
          <p>Everyday menswear, cut to fit the way you live. One backoffice for the store, the stock, the orders and the website.</p>
        </div>
      </section>

      <section className="adm-auth__side">
        <form className="adm-auth__form" onSubmit={submit}>
          <div className="adm-auth__logo">
            <span className="adm-logo" aria-hidden="true" />
            <span>Gentle Wear</span>
            <span className="adm-auth__badge">CMS</span>
          </div>

          <h1>Welcome Back</h1>
          <p className="adm-muted">Sign in to manage products, stock, orders and site content.</p>

          <label className="adm-field">
            <span>Email</span>
            <input type="email" placeholder="you@gentlewear.test" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </label>
          <label className="adm-field">
            <span>Password</span>
            <span className="adm-pass">
              <input
                type={show ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>

          <label className="adm-check">
            <input type="checkbox" defaultChecked /> Remember me on this device
          </label>

          {error && (
            <p className="adm-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="adm-btn adm-btn--dark adm-btn--block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="adm-auth__foot">Gentle Wear · Backoffice ERP &amp; CMS</p>
        </form>
      </section>
    </main>
  );
}
