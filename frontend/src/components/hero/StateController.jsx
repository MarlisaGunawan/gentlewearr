import { useCallback, useEffect, useRef, useState } from 'react';

// Where the hover capsule sits for each column (0 = "Select state →", 1–4 = buttons).
// The outer two stick out 5px so the glass edge doesn't look pinched.
const CAPSULE_POSITIONS = [
  { left: '-5px', width: 'calc(20% + 5px)' },
  { left: '20%', width: '20%' },
  { left: '40%', width: '20%' },
  { left: '60%', width: '20%' },
  { left: '80%', width: 'calc(20% + 5px)' },
];

/** Joins class names, skipping falsy ones: cx('a', false && 'b') → 'a'. */
const cx = (...names) => names.filter(Boolean).join(' ');

export default function StateController({
  label,
  controls,
  readyIds,
  phase,
  activeId,
  onSelect,
  onReset,
}) {
  const controllerRef = useRef(null);
  const anchorRef = useRef(null); // invisible box where the collapsed capsule ends up
  const buttonRefs = useRef({});
  const focusAfterRef = useRef(null); // button id to re-focus when the transition ends

  const keyboardIndexRef = useRef(null); // column focused with the keyboard, if any

  const [highlight, setHighlight] = useState(0); // column under the hover capsule
  const [travel, setTravel] = useState({ dx: 0, dy: 0 });

  const isIdle = phase === 'idle';
  const collapsed = phase === 'forward' || phase === 'selected';
  const capsuleIndex = isIdle ? highlight : 0;

  // How far the chosen label must move to sit in the centre of the collapsed capsule.
  // Uses offsetLeft/Top (layout positions) so the label's own transform doesn't affect it.
  const measureTravel = useCallback((controlId) => {
    const button = buttonRefs.current[controlId];
    const anchor = anchorRef.current;
    setTravel({
      dx: anchor.offsetLeft + anchor.offsetWidth / 2 - (button.offsetLeft + button.offsetWidth / 2),
      dy: anchor.offsetTop + anchor.offsetHeight / 2 - (button.offsetTop + button.offsetHeight / 2),
    });
  }, []);

  // Keep the label centred if the window is resized while collapsed.
  useEffect(() => {
    if (!collapsed || !activeId) return undefined;
    const onResize = () => measureTravel(activeId);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [collapsed, activeId, measureTravel]);

  // Disabling a focused button drops focus to <body>; give it back once usable again.
  useEffect(() => {
    if (phase !== 'selected' && phase !== 'idle') return;
    const id = focusAfterRef.current;
    if (!id) return;
    focusAfterRef.current = null;
    buttonRefs.current[id].focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (!isIdle) setHighlight(0);
  }, [isIdle]);

  const handleClick = (event, control) => {
    const hadFocus = document.activeElement === event.currentTarget;

    if (phase === 'selected' && control.id === activeId) {
      if (onReset() && hadFocus) focusAfterRef.current = control.id;
      return;
    }
    measureTravel(control.id);
    if (onSelect(control.id) && hadFocus) focusAfterRef.current = control.id;
  };

  // Move the glass highlight with the pointer, without re-rendering.
  const handlePointerMove = (event) => {
    const rect = controllerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    controllerRef.current.style.setProperty('--glass-x', x.toFixed(1) + '%');
    controllerRef.current.style.setProperty('--glass-y', y.toFixed(1) + '%');
  };

  const capsule = CAPSULE_POSITIONS[capsuleIndex];

  return (
    <div
      ref={controllerRef}
      className={cx(
        'controller',
        collapsed && 'collapsed',
        phase === 'reverse' && 'reversing'
      )}
      role="group"
      aria-label="Scene state controller"
      style={{ '--cap-left': capsule.left, '--cap-width': capsule.width }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHighlight(keyboardIndexRef.current ?? 0)}
    >
      <div className="track glass" aria-hidden="true">
        <div className="track__dividers" />
      </div>
      <div className="capsule glass" aria-hidden="true" />
      <div className="capsule-anchor" ref={anchorRef} aria-hidden="true" />

      <div className="cells">
        <div className={cx('cell cell--label', capsuleIndex > 0 && 'is-dimmed', collapsed && 'is-faded')}>
          {label}
        </div>

        {controls.map((control, i) => {
          const index = i + 1;
          const isChosen = control.id === activeId;
          const showReset = isChosen && phase === 'selected';
          const isOther = Boolean(activeId) && !isChosen;
          const enabled = isIdle ? readyIds.includes(control.id) : showReset;

          return (
            <button
              key={control.id}
              ref={(el) => {
                buttonRefs.current[control.id] = el;
              }}
              type="button"
              className={cx(
                'cell',
                isIdle && !readyIds.includes(control.id) && 'is-loading',
                isChosen && collapsed && 'is-travelling',
                isOther && collapsed && 'is-faded',
                showReset && 'show-reset'
              )}
              style={isChosen && collapsed ? { '--dx': travel.dx + 'px', '--dy': travel.dy + 'px' } : undefined}
              disabled={!enabled}
              aria-hidden={isOther || undefined}
              tabIndex={isOther ? -1 : undefined}
              aria-label={showReset ? 'Reset' : control.label}
              onClick={(event) => handleClick(event, control)}
              onPointerEnter={() => isIdle && setHighlight(index)}
              onFocus={(event) => {
                if (!isIdle || !event.currentTarget.matches(':focus-visible')) return;
                keyboardIndexRef.current = index;
                setHighlight(index);
              }}
              onBlur={() => {
                keyboardIndexRef.current = null;
                setHighlight(0);
              }}
            >
              <span className="cell__text" aria-hidden="true">{control.label}</span>
              <span className="cell__reset" aria-hidden="true">Reset</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
