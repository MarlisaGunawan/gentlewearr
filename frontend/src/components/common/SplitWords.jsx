import { Fragment } from 'react';

/**
 * Wraps every word in its own masked span, so GSAP can slide words up one by one.
 * Use inside an element with `data-reveal-words`.
 */
export default function SplitWords({ text }) {
  return text.split(' ').map((word, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="word">
        <span className="word__inner">{word}</span>
      </span>
    </Fragment>
  ));
}
