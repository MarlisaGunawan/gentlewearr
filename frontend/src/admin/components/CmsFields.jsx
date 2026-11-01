import { ArrowDown, ArrowUp, ImageUp, RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAdmin } from '../AdminAuth';

const isVideo = (url) => /\.(mp4|webm)(\?|$)/i.test(url ?? '');

/**
 * One photo / video / icon: paste a link or upload a file (POST /media).
 * Empty = the website keeps its bundled default.
 */
export function MediaField({ value, onChange, kind = 'image' }) {
  const { request } = useAdmin();
  const inputRef = useRef(null);
  const [state, setState] = useState('');
  const accept = kind === 'video' ? 'video/mp4,video/webm' : kind === 'icon' ? 'image/png,image/x-icon,.ico' : 'image/*';

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setState('Uploading ' + file.name + '…');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await request('/media', { method: 'POST', body, timeout: 180000 });
      onChange(res.url);
      setState('');
    } catch (e) {
      setState(e.errors?.file?.[0] ?? e.message);
    }
  };

  return (
    <div className={'adm-media adm-media--' + kind}>
      <div className="adm-media__preview">
        {!value ? (
          <span className="adm-muted">Default</span>
        ) : isVideo(value) ? (
          <video src={value} muted loop autoPlay playsInline />
        ) : (
          <img src={value} alt="" />
        )}
      </div>
      <div className="adm-media__body">
        <input type="text" value={value ?? ''} placeholder="Empty = use the default · or paste https://…" onChange={(e) => onChange(e.target.value)} aria-label="Media link" />
        <div className="adm-media__tools">
          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => inputRef.current.click()}>
            <ImageUp size={14} aria-hidden="true" /> Upload {kind}
          </button>
          {value && (
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => onChange('')}>
              <RotateCcw size={14} aria-hidden="true" /> Use default
            </button>
          )}
          <input ref={inputRef} type="file" accept={accept} hidden onChange={upload} />
        </div>
        {state && <small className={state.startsWith('Uploading') ? 'adm-muted' : 'adm-error-text'}>{state}</small>}
      </div>
    </div>
  );
}

/** Navbar links: rename, show / hide and reorder. */
export function NavLinksEditor({ value, onChange }) {
  const update = (i, patch) => onChange(value.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <ol className="adm-picker adm-links">
      {value.map((link, i) => (
        <li key={link.id} className={link.visible ? undefined : 'is-off'}>
          <span className="adm-picker__n">{i + 1}</span>
          <input value={link.label} maxLength={20} onChange={(e) => update(i, { label: e.target.value })} aria-label={'Label for ' + link.id} />
          <code>#{link.id}</code>
          <label className="adm-switch" title={link.visible ? 'Shown' : 'Hidden'}>
            <input type="checkbox" checked={link.visible} onChange={(e) => update(i, { visible: e.target.checked })} />
            <span aria-hidden="true" />
            <span className="visually-hidden">Show {link.label}</span>
          </label>
          <span className="adm-picker__tools">
            <button type="button" className="adm-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
              <ArrowUp size={14} />
            </button>
            <button type="button" className="adm-icon-btn" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
              <ArrowDown size={14} />
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Hero buttons: each has a label and a forward + reverse video. */
export function ClipsEditor({ value, onChange }) {
  const update = (i, patch) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <div className="adm-clips">
      {value.map((c, i) => (
        <fieldset key={c.id} className="adm-clip">
          <legend>
            Button {i + 1}
            <input value={c.label} maxLength={16} onChange={(e) => update(i, { label: e.target.value })} aria-label={'Button ' + (i + 1) + ' label'} />
          </legend>
          <div className="adm-clip__pair">
            <div>
              <span>Forward clip</span>
              <MediaField kind="video" value={c.forward} onChange={(v) => update(i, { forward: v })} />
            </div>
            <div>
              <span>Reverse clip (same clip played backwards)</span>
              <MediaField kind="video" value={c.reverse} onChange={(v) => update(i, { reverse: v })} />
            </div>
          </div>
        </fieldset>
      ))}
    </div>
  );
}
