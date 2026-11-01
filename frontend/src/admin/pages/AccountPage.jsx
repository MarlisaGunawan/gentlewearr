import { useState } from 'react';
import { useAdmin } from '../AdminAuth';
import Avatar from '../components/Avatar';

/** Signed-in admin: profile and change password. */
export default function AccountPage() {
  const { user, request } = useAdmin();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage('');
    try {
      await request('/me/password', { method: 'PUT', body: form });
      setForm({ current_password: '', password: '', password_confirmation: '' });
      setMessage('Password changed ✓');
    } catch (e) {
      setErrors(Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, v]) => [k, v[0]])));
      if (!e.errors) setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, autoComplete) => (
    <label className={'adm-field' + (errors[key] ? ' has-error' : '')}>
      <span>{label}</span>
      <input type="password" value={form[key]} onChange={set(key)} autoComplete={autoComplete} required />
      {errors[key] && <small>{errors[key]}</small>}
    </label>
  );

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Account</h1>
          <p className="adm-muted">Your backoffice profile and password.</p>
        </div>
      </header>

      <div className="adm-grid adm-grid--split">
        <section className="adm-card">
          <div className="adm-card__title">
            <h2>Profile</h2>
          </div>
          {user && (
            <div className="adm-profile">
              <Avatar name={user.name} size={56} />
              <div>
                <strong>{user.name}</strong>
                <p className="adm-muted">{user.email}</p>
                <span className="badge badge--info">{user.role ?? 'owner'}</span>
              </div>
            </div>
          )}
        </section>

        <form className="adm-card adm-form" onSubmit={save}>
          <div className="adm-card__title">
            <h2>Change password</h2>
          </div>
          {field('current_password', 'Current password', 'current-password')}
          {field('password', 'New password (min. 8 characters)', 'new-password')}
          {field('password_confirmation', 'Repeat new password', 'new-password')}
          {message && <p className={message.endsWith('✓') ? 'adm-ok' : 'adm-error'}>{message}</p>}
          <div>
            <button type="submit" className="adm-btn adm-btn--dark" disabled={busy}>
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
