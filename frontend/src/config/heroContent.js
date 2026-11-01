// All text and media for the hero section live here.
// Later, the Laravel CMS will return this same shape from `GET /api/hero`,
// so the components will not need to change, only where the data comes from.

// Where the 8 clips live. Override in `.env.local` with VITE_MEDIA_BASE,
// e.g. `/test-videos/` for the local test clips in /public.
export const MEDIA_BASE =
  import.meta.env.VITE_MEDIA_BASE ||
  'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/';

export const heroContent = {
  // Shown as three words that fade out one by one.
  titleWords: ['The', 'new', 'standard'],

  description:
    'Gentle Wear makes everyday menswear — tees, shirts, chinos and jackets — cut to fit the way you live, from the office to the weekend.',

  controllerLabel: 'Select state →',
};

// One entry per controller button, in the order they appear.
// `holdForward` / `holdReverse` = how many seconds before the end we pause,
// so the clip stops on a clean last frame (Scene reverse needs a bigger margin).
export const controls = [
  {
    id: 'scene',
    label: 'Scene',
    forward: MEDIA_BASE + 'video-2.mp4',
    reverse: MEDIA_BASE + 'video-2-reverse.mp4',
    holdForward: 0.08,
    holdReverse: 0.18,
  },
  {
    id: 'light',
    label: 'Lighting',
    forward: MEDIA_BASE + 'video-3.mp4',
    reverse: MEDIA_BASE + 'video-3-reverse.mp4',
    holdForward: 0.08,
    holdReverse: 0.08,
  },
  {
    id: 'colorway',
    label: 'Clothing',
    forward: MEDIA_BASE + 'video-1.mp4',
    reverse: MEDIA_BASE + 'video-1-reverse.mp4',
    holdForward: 0.08,
    holdReverse: 0.08,
  },
  {
    id: 'fullLook',
    label: 'Cast',
    forward: MEDIA_BASE + 'video-4.mp4',
    reverse: MEDIA_BASE + 'video-4-reverse.mp4',
    holdForward: 0.08,
    holdReverse: 0.08,
  },
];

// The opening picture is frame 0 of the Clothing forward clip.
export const BASE_CLIP_KEY = 'colorway:forward';

// Every <video> gets a key like "scene:forward" or "scene:reverse".
export const clipKey = (controlId, direction) => controlId + ':' + direction;

export const clips = controls.flatMap((control) => [
  { key: clipKey(control.id, 'forward'), src: control.forward },
  { key: clipKey(control.id, 'reverse'), src: control.reverse },
]);
