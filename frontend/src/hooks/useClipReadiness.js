import { useCallback, useEffect, useState } from 'react';

/**
 * Tracks which <video> elements have a decoded frame (readyState >= 2).
 * Returns { ready, failed, reloadFailed } where ready/failed are { [clipKey]: true }.
 */
export function useClipReadiness(videoRefs, clips) {
  const [ready, setReady] = useState({});
  const [failed, setFailed] = useState({});

  useEffect(() => {
    const cleanups = clips.map(({ key }) => {
      const video = videoRefs.current[key];

      const markReady = () => {
        setReady((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
        setFailed((prev) => {
          if (!prev[key]) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      };
      const markFailed = () => setFailed((prev) => ({ ...prev, [key]: true }));

      // Cached media may already be loaded and never fire `loadeddata` again.
      if (video.readyState >= 2) markReady();
      video.addEventListener('loadeddata', markReady);
      video.addEventListener('error', markFailed);

      return () => {
        video.removeEventListener('loadeddata', markReady);
        video.removeEventListener('error', markFailed);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [videoRefs, clips]);

  const reloadFailed = useCallback(() => {
    Object.keys(failed).forEach((key) => videoRefs.current[key].load());
  }, [failed, videoRefs]);

  return { ready, failed, reloadFailed };
}
