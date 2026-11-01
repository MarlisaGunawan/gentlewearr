import SplitWords from '../common/SplitWords';

// White card: large photo on the left, story + call to action on the right.
export default function EditorialFeature({ id, story }) {
  return (
    <section id={id} className="card editorial" data-reveal-scale>
      <div className="editorial__media" data-parallax-scope>
        <img src={story.image} alt="" loading="lazy" data-parallax="8" />
        <span className="editorial__tag">{story.tag}</span>
        <p className="editorial__overlay" data-reveal>
          {story.overlay}
        </p>
      </div>

      <div className="editorial__body">
        <h2 data-reveal-words>
          <SplitWords text={story.title} />
        </h2>
        <p data-reveal>{story.text}</p>
        <a className="pill pill--outline" href="#" data-reveal>
          {story.action}
        </a>

        <div className="editorial__thumbs" data-reveal-stagger>
          {story.thumbs.map((src) => (
            <div key={src} className="editorial__thumb" data-parallax-scope>
              <img src={src} alt="" loading="lazy" data-parallax="10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
