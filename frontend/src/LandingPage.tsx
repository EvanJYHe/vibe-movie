import { useState } from "react";
import "./LandingPage.css";

const editorPath = "/editor";

function preloadEditor() {
  void import("./App.tsx");
}

export function LandingPage() {
  const [isHeroReady, setIsHeroReady] = useState(false);

  return (
    <div
      className={`landing-page${isHeroReady ? " is-ready" : ""}`}
      id="top"
    >
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
                  <span className="home-hero__verb">make</span> better videos
                </span>
                <span className="home-hero__line">in less time.</span>
              </h1>
              <p className="home-hero__lede">
                A fully featured video editor with AI built in. Edit every
                detail yourself or describe what you want and let AI do the
                work.
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
                onLoad={() => setIsHeroReady(true)}
                onError={() => setIsHeroReady(true)}
              />
            </figure>
          </section>
        </main>

      </div>
    </div>
  );
}
