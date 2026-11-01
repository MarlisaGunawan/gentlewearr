import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_CLIP_KEY, clipKey, controls } from '../config/heroContent';
import { holdAtLastFrame, startFromFirstFrame } from '../lib/videoPlayback';

/*
 * The scene state machine.
 *
 *   base ──forward──▶ selected ──reverse──▶ base
 *
 * phase: 'idle' (at base) | 'forward' | 'selected' | 'reverse'
 * Only one transition can run at a time; branch-to-branch is not allowed.
 */
export function useScenePlayer(getVideo, baseReady) {
  const [phase, setPhase] = useState('idle');
  const [activeId, setActiveId] = useState(null);
  const [titleHidden, setTitleHidden] = useState(false);
  const [error, setError] = useState(null); // { message, controlId, direction }
  const [announcement, setAnnouncement] = useState('Loading scene…');

  // Refs (not state) for things that must update instantly and never re-render.
  const lockRef = useRef(false); // true while a transition runs
  const sceneRef = useRef('base'); // committed scene: 'base' or a control id
  const tokenRef = useRef(0); // id of the latest transition, to ignore stale callbacks
  const visibleKeyRef = useRef(null); // which <video> is currently shown
  const cancelHoldRef = useRef(null);
  const titleTimerRef = useRef(null);

  // Show one video and hide the previous one in the same tick (no crossfade).
  const showClip = useCallback(
    (key) => {
      const previousKey = visibleKeyRef.current;
      if (previousKey === key) return;
      getVideo(key).dataset.visible = 'true';
      if (previousKey) delete getVideo(previousKey).dataset.visible;
      visibleKeyRef.current = key;
    },
    [getVideo]
  );

  // Opening picture: the base clip parked on frame 0.
  useEffect(() => {
    if (baseReady && !visibleKeyRef.current) {
      showClip(BASE_CLIP_KEY);
      setAnnouncement('Scene ready. Choose a state.');
    }
  }, [baseReady, showClip]);

  // Stop everything if the component unmounts.
  useEffect(
    () => () => {
      tokenRef.current += 1;
      if (cancelHoldRef.current) cancelHoldRef.current();
      clearTimeout(titleTimerRef.current);
    },
    []
  );

  const runTransition = useCallback(
    async (control, direction) => {
      const token = ++tokenRef.current;
      const isStale = () => token !== tokenRef.current;
      const key = clipKey(control.id, direction);
      const video = getVideo(key);
      const holdSeconds = direction === 'forward' ? control.holdForward : control.holdReverse;

      setError(null);
      setActiveId(control.id);
      setPhase(direction);
      setAnnouncement(direction === 'forward' ? 'Changing ' + control.label + '…' : 'Resetting…');

      try {
        // 1. Start the hidden clip and wait for a fresh first frame.
        await startFromFirstFrame(video);
        if (isStale()) return;

        // 2. Swap it in. The old frame stayed visible until this exact moment.
        showClip(key);

        if (direction === 'forward') {
          const hideAt = Math.min(video.duration * 0.12, 0.9);
          titleTimerRef.current = setTimeout(() => setTitleHidden(true), hideAt * 1000);
        }

        // 3. Let it play, then pause on the last clean frame.
        const hold = holdAtLastFrame(video, holdSeconds);
        cancelHoldRef.current = hold.cancel;
        await hold.promise;
        cancelHoldRef.current = null;
        if (isStale()) return;

        // 4. Commit the new scene.
        if (direction === 'forward') {
          sceneRef.current = control.id;
          setPhase('selected');
          setAnnouncement(control.label + ' changed. Press Reset to go back.');
        } else {
          sceneRef.current = 'base';
          setPhase('idle');
          setActiveId(null);
          setTitleHidden(false);
          setAnnouncement('Back to the original scene.');
        }
      } catch (err) {
        if (isStale()) return;
        // The last valid frame is still visible; restore the controller to match it.
        clearTimeout(titleTimerRef.current);
        if (direction === 'forward') {
          setPhase('idle');
          setActiveId(null);
        } else {
          setPhase('selected');
        }
        setError({ message: err.message, controlId: control.id, direction });
        setAnnouncement('Something went wrong: ' + err.message);
      } finally {
        if (!isStale()) lockRef.current = false;
      }
    },
    [getVideo, showClip]
  );

  /** Base → branch. Ignored if busy or a branch is already selected. */
  const select = useCallback(
    (controlId) => {
      if (lockRef.current || sceneRef.current !== 'base') return false;
      lockRef.current = true; // locked synchronously, before any await
      runTransition(controls.find((c) => c.id === controlId), 'forward');
      return true;
    },
    [runTransition]
  );

  /** Branch → base. */
  const reset = useCallback(() => {
    if (lockRef.current || sceneRef.current === 'base') return false;
    lockRef.current = true;
    runTransition(controls.find((c) => c.id === sceneRef.current), 'reverse');
    return true;
  }, [runTransition]);

  const retry = useCallback(() => {
    if (!error) return;
    if (error.direction === 'forward') select(error.controlId);
    else reset();
  }, [error, select, reset]);

  return { phase, activeId, titleHidden, error, announcement, select, reset, retry };
}
