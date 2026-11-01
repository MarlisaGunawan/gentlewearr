import { Fragment } from 'react';

export default function HeroCopy({ titleWords, description }) {
  return (
    <div className="hero">
      <h1 className="hero__title">
        {titleWords.map((word, i) => (
          <Fragment key={word + i}>
            {i > 0 && ' '}
            <span>{word}</span>
          </Fragment>
        ))}
      </h1>
      <p className="hero__text">{description}</p>
    </div>
  );
}
