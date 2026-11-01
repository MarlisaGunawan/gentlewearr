import { Link } from 'react-router-dom';
import { footerContent as content } from '../../config/footerContent';
import { useSectionNav } from '../../hooks/useSectionNav';

const socialIcons = {
  Instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.2 4.4 5 4.6" />
    </svg>
  ),
};

export default function SiteFooter() {
  const { media } = content;
  const goToSection = useSectionNav();

  const goTo = (event, id) => {
    event.preventDefault();
    goToSection(id);
  };

  return (
    <footer id="contact" className="footer" data-parallax-scope>
      {/* Background scene, softly faded into the paper colour at the top. */}
      <div className="footer__stage" aria-hidden="true" data-parallax="6">
        {media.video ? (
          <video
            className="footer__media"
            src={media.video}
            poster={media.image}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : (
          <img className="footer__media" src={media.image} alt="" loading="lazy" />
        )}
      </div>

      <p className="footer__wordmark" aria-hidden="true">
        {content.brand}
      </p>
      <div className="footer__fog" aria-hidden="true" />

      <div className="footer__content" data-reveal-stagger>
        <div className="brand">
          <a className="brand__logo" href="#home" aria-label={content.brand + ' home'} onClick={(e) => goTo(e, 'home')}>
            <span className="brand__mark" />
            {content.brand}
          </a>
          <h2 className="brand__title">{content.title}</h2>
          <p className="brand__text">{content.text}</p>

          <a className="brand__cta" href={'#' + content.cta.target} onClick={(e) => goTo(e, content.cta.target)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 8h12l-1 12H7L6 8zm3 0a3 3 0 0 1 6 0" />
            </svg>
            {content.cta.label}
          </a>

          <p className="brand__copy">{content.copyright}</p>
        </div>

        <nav className="col col--menu" aria-label="Menu">
          <h3 className="col__title">Menu</h3>
          <ul className="col__list">
            {content.menu.map((link) => (
              <li key={link.id}>
                <a href={'#' + link.id} onClick={(e) => goTo(e, link.id)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="col" aria-label="Categories">
          <h3 className="col__title">Categories</h3>
          <ul className="col__list">
            {content.categories.map((category) => (
              <li key={category.slug}>
                <Link to={'/shop/' + category.slug}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="col" aria-label="Essentials">
          <h3 className="col__title">Essentials</h3>
          <ul className="col__list">
            {content.essentials.map((label) => (
              <li key={label}>
                <a href="#">{label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col">
          <h3 className="col__title">Follow us</h3>
          <ul className="social">
            {content.social.map((item) => (
              <li key={item.name}>
                <a
                  className="social__link"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  title={item.name}
                >
                  {socialIcons[item.name]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
