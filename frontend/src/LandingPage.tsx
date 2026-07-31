import "./LandingPage.css";

const editorPath = "/editor";

function preloadEditor() {
  void import("./App.tsx");
}

type FooterIconName = "portfolio" | "github" | "linkedin" | "x" | "email";

function FooterIcon({ name }: { name: FooterIconName }) {
  if (name === "github") {
    return (
      <svg
        className="home-site-footer__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3 1S18.2.6 15 2.3a13.4 13.4 0 0 0-7 0C4.8.6 3.7 1 3.7 1a5 5 0 0 0-.1 3A5.4 5.4 0 0 0 2.2 7.5c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4" />
        <path d="M8 19c-3 .9-3-1.5-4-2" />
      </svg>
    );
  }

  if (name === "linkedin") {
    return (
      <svg
        className="home-site-footer__icon home-site-footer__icon--fill"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="4.5" cy="5" r="2.25" />
        <rect x="2.5" y="9" width="4" height="12" />
        <path d="M9.5 9h4v1.7c1.2-1.5 2.8-2.2 4.6-2.2 3.8 0 5.9 2.5 5.9 6.7V21h-4v-5.3c0-2.2-.8-3.5-2.7-3.5-2.3 0-3.8 1.5-3.8 4V21h-4V9Z" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg
        className="home-site-footer__icon home-site-footer__icon--fill"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.9l-5.4-7-6.1 7H1.2l7.9-9L.7 2h7.1l4.8 6.3L18.2 2Zm-1.2 18h1.9L6.8 3.9h-2L17 20Z" />
      </svg>
    );
  }

  if (name === "email") {
    return (
      <svg
        className="home-site-footer__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </svg>
    );
  }

  return (
    <svg
      className="home-site-footer__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

export function LandingPage() {
  return (
    <div className="landing-page" id="top">
      <div className="home-page-shell">
        <header className="home-site-header" aria-label="Primary">
          <a
            className="home-wordmark"
            href="#top"
            aria-label="Vibe Movie home"
          >
            <img
              className="home-wordmark__mark"
              src="/vibe-film-gate-mark-v1.webp"
              alt=""
              width="32"
              height="32"
            />
            <span>Vibe Movie</span>
          </a>

          <a
            className="home-nav-action"
            href={editorPath}
            onFocus={preloadEditor}
            onPointerEnter={preloadEditor}
          >
            enter studio
          </a>
        </header>

        <main>
          <section className="home-hero" aria-labelledby="home-hero-title">
            <div className="home-hero__copy">
              <p className="home-hero__signal">
                AI-native video editing studio
              </p>
              <h1 className="home-hero__title" id="home-hero-title">
                <span className="home-hero__line">
                  <span className="home-hero__verb">make</span> the movie
                </span>
                <span className="home-hero__line">but easier.</span>
              </h1>
              <p className="home-hero__lede">
                A full video editor with AI built in. Make cuts, add effects,
                and refine your timeline faster.
              </p>
              <a
                className="home-action-link"
                href={editorPath}
                onFocus={preloadEditor}
                onPointerEnter={preloadEditor}
              >
                Start editing
              </a>
            </div>

            <figure className="home-apparatus">
              <img
                className="home-apparatus__image"
                src="/vibe-film-gate-v1.webp"
                alt="A luminous black-and-gold film gate forming the letter V around a framed mountain scene."
                width="1024"
                height="1536"
                fetchPriority="high"
                decoding="async"
              />
            </figure>
          </section>
        </main>

        <footer className="home-site-footer">
          <p className="home-site-footer__credit">
            Made with{" "}
            <span
              aria-label="love"
              className="home-site-footer__heart"
              role="img"
            >
              ♥︎
            </span>{" "}
            by Evan He
          </p>
          <nav className="home-site-footer__links" aria-label="Evan He online">
            <a
              className="home-site-footer__link"
              href="https://evanhe.co"
              rel="noreferrer"
              target="_blank"
            >
              <FooterIcon name="portfolio" />
              <span className="home-site-footer__label">Portfolio</span>
            </a>
            <a
              className="home-site-footer__link"
              href="https://github.com/EvanJYHe"
              rel="noreferrer"
              target="_blank"
            >
              <FooterIcon name="github" />
              <span className="home-site-footer__label">GitHub</span>
            </a>
            <a
              className="home-site-footer__link"
              href="https://www.linkedin.com/in/evan-he-4253712a9/"
              rel="noreferrer"
              target="_blank"
            >
              <FooterIcon name="linkedin" />
              <span className="home-site-footer__label">LinkedIn</span>
            </a>
            <a
              className="home-site-footer__link"
              href="https://x.com/EvanJYHe"
              rel="noreferrer"
              target="_blank"
            >
              <FooterIcon name="x" />
              <span className="home-site-footer__label">Twitter / X</span>
            </a>
            <a
              className="home-site-footer__link"
              href="mailto:e35h@uwaterloo.ca"
            >
              <FooterIcon name="email" />
              <span className="home-site-footer__label">Email</span>
            </a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
