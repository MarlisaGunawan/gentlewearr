import { useCallback, useRef } from 'react';
import { BASE_CLIP_KEY, clipKey, clips, controls, heroContent } from '../../config/heroContent';
import { useClipReadiness } from '../../hooks/useClipReadiness';
import { useScenePlayer } from '../../hooks/useScenePlayer';
import HeroCopy from './HeroCopy';
import StateController from './StateController';

export default function Hero() {
  // One persistent <video> per clip. Their `src` never changes.
  const videoRefs = useRef({});
  const getVideo = useCallback((key) => videoRefs.current[key], []);

  const { ready, failed, reloadFailed } = useClipReadiness(videoRefs, clips);
  const player = useScenePlayer(getVideo, Boolean(ready[BASE_CLIP_KEY]));

  // A button is usable only when both its forward and reverse clips are ready.
  const readyIds = controls
    .filter((c) => ready[clipKey(c.id, 'forward')] && ready[clipKey(c.id, 'reverse')])
    .map((c) => c.id);

  const loadFailed = Object.keys(failed).length > 0;

  return (
    <section id="home" className={'stage' + (player.titleHidden ? ' title-hidden' : '')}>
      {clips.map((clip) => (
        <video
          key={clip.key}
          ref={(el) => {
            videoRefs.current[clip.key] = el;
          }}
          className="media"
          src={clip.src}
          muted
          playsInline
          preload="auto"
          poster={heroContent.poster || undefined}
          aria-hidden="true"
        />
      ))}

      <HeroCopy titleWords={heroContent.titleWords} description={heroContent.description} />

      <StateController
        label={heroContent.controllerLabel}
        controls={controls}
        readyIds={readyIds}
        phase={player.phase}
        activeId={player.activeId}
        onSelect={player.select}
        onReset={player.reset}
      />

      <p className="visually-hidden" aria-live="polite">
        {player.announcement}
      </p>

      {(player.error || loadFailed) && (
        <div className="notice" role="alert">
          <span>{player.error ? player.error.message : 'Some videos could not load.'}</span>
          <button type="button" onClick={player.error ? player.retry : reloadFailed}>
            Retry
          </button>
        </div>
      )}
    </section>
  );
}
