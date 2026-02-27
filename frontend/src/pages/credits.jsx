import React from "react";
import "../styles/CreditsPage.css";

const creditSources = [
  {
    label: "Pixel Character Sprites, Tilesets, and Maps",
    creator: "RPG Maker / Aseprites",
    link: "https://www.rpgmakerweb.com/",
  },
  {
    label: "Pixel Art Backgrounds",
    creator: "Anasabdin",
    link: "https://www.tumblr.com/anasabdin",
  }
];

const Credits = () => {
  return (
    <div className="credits-page">
      <div className="credits-noise" aria-hidden="true" />

      <main className="credits-content">
        <div className="credits-pill">Asset Credit Log</div>

        <h1 className="credits-title">CREDITS</h1>
        <p className="credits-subtitle">
          Thank you to the creators and communities behind the images, backgrounds,
          and tilesets used across Code Mania.
        </p>

        <section className="credits-grid" aria-label="Asset credits">
          {creditSources.map((item) => (
            <a key={item.label} className="credit-card" href={item.link} target="_blank" rel="noreferrer">
              <span className="credit-label">{item.label}</span>
              <span className="credit-creator">{item.creator}</span>
            </a>
          ))}
        </section>

        <p className="credits-footnote">Built with respect for every artist and asset creator.</p>
      </main>
    </div>
  );
};

export default Credits;
