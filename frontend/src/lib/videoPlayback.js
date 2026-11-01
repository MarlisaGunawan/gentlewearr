// Low-level helpers for playing one clip without a visible "seam".
// Nothing in here knows about React; each function takes a <video> element.

const FIRST_FRAME_TIMEOUT_MS = 12000;

/** Move a (hidden) video back to frame 0 and wait until the seek is done. */
export function rewindToStart(video) {
  video.pause();
  if (video.currentTime <= 0.001) return Promise.resolve();

  return new Promise((resolve) => {
    video.addEventListener('seeked', resolve, { once: true });
    video.currentTime = 0;
  });
}

/**
 * Wait until the video has decoded a frame from the START of the clip.
 * Returns { promise, cancel } so the caller can clean up the callbacks.
 */
function waitForFirstFrame(video) {
  let cancelled = false;
  let cancel = () => {};

  const promise = new Promise((resolve) => {
    // Modern browsers: get called for every painted video frame.
    if ('requestVideoFrameCallback' in video) {
      let handle;
      const check = (_now, meta) => {
        if (cancelled) return;
        // An old frame from the end of the clip has a big mediaTime: ignore it.
        if (meta.mediaTime <= 0.5 && video.readyState >= 2) resolve();
        else handle = video.requestVideoFrameCallback(check);
      };
      handle = video.requestVideoFrameCallback(check);
      cancel = () => {
        cancelled = true;
        video.cancelVideoFrameCallback(handle);
      };
      return;
    }

    // Fallback: wait for "playing", then two animation frames so it is painted.
    let rafId;
    const onPlaying = () => {
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          if (!cancelled && video.readyState >= 2 && video.currentTime <= 0.5) resolve();
        });
      });
    };
    video.addEventListener('playing', onPlaying, { once: true });
    cancel = () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      video.removeEventListener('playing', onPlaying);
    };
  });

  return { promise, cancel };
}

/**
 * One attempt to start the clip from frame 0.
 * Resolves 'started' when a fresh frame is ready, or 'hidden' if the tab was hidden
 * (frame callbacks freeze in background tabs, so we stop and try again later).
 * Rejects on play() failure or timeout — a timeout is NEVER treated as success.
 */
function attemptStart(video) {
  if (document.hidden) return Promise.resolve('hidden');

  return rewindToStart(video).then(() => {
    // Register the frame callback BEFORE play(), so we cannot miss the first frame.
    const firstFrame = waitForFirstFrame(video);
    let timerId;
    let onHide;

    const started = Promise.all([video.play(), firstFrame.promise]).then(() => 'started');
    started.catch(() => {}); // avoid "unhandled rejection" if we stop early (tab hidden)

    const timeout = new Promise((_, reject) => {
      timerId = setTimeout(
        () => reject(new Error('The video took too long to start.')),
        FIRST_FRAME_TIMEOUT_MS
      );
    });

    const hidden = new Promise((resolve) => {
      onHide = () => {
        if (!document.hidden) return;
        video.pause();
        video.currentTime = 0;
        resolve('hidden');
      };
      document.addEventListener('visibilitychange', onHide);
    });

    const cleanup = () => {
      clearTimeout(timerId);
      firstFrame.cancel();
      document.removeEventListener('visibilitychange', onHide);
    };

    return Promise.race([started, timeout, hidden]).then(
      (result) => {
        cleanup();
        return result;
      },
      (error) => {
        cleanup();
        video.pause();
        throw error;
      }
    );
  });
}

function waitUntilTabVisible() {
  if (!document.hidden) return Promise.resolve();
  return new Promise((resolve) => {
    const onShow = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onShow);
      resolve();
    };
    document.addEventListener('visibilitychange', onShow);
  });
}

/** Start the clip from frame 0, pausing the timeout while the tab is hidden. */
export async function startFromFirstFrame(video) {
  for (;;) {
    const result = await attemptStart(video);
    if (result === 'started') return;
    await waitUntilTabVisible(); // then restart with a fresh 12 s timer
  }
}

/**
 * Let the playing clip run, then pause it `holdSeconds` before its end
 * so it rests on a clean final frame. `ended` is only a safety net.
 * Returns { promise, cancel }.
 */
export function holdAtLastFrame(video, holdSeconds) {
  let rafId;
  let finish;

  const promise = new Promise((resolve) => {
    const holdAt = video.duration - holdSeconds;

    finish = () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('ended', finish);
      video.pause();
      resolve();
    };

    const tick = () => {
      if (video.currentTime >= holdAt) finish();
      else rafId = requestAnimationFrame(tick);
    };

    video.addEventListener('ended', finish);
    tick();
  });

  const cancel = () => {
    cancelAnimationFrame(rafId);
    video.removeEventListener('ended', finish);
  };

  return { promise, cancel };
}
