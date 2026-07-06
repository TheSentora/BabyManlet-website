"use client";

import { useEffect, useState } from "react";
import { useTokenFeed } from "./useTokenFeed";

const MINT = "FULwoFmBd9fjviRV5K4Yad1UgdYuurDjASrMVv7spump";
const X_URL = "https://x.com/Baby_Manlet";
const TG_URL = "https://t.me/baby_manlet";
const BUY_URL = `https://pump.fun/coin/${MINT}`;

const PER_PAGE = 10;

export default function Page() {
  const [copied, setCopied] = useState(false);
  const [logoOk, setLogoOk] = useState(false);
  const [artOk, setArtOk] = useState(false);
  const [page, setPage] = useState(0);

  const events = useTokenFeed(MINT);

  // probe /public images so fallbacks show until you drop the files in
  useEffect(() => {
    const probe = (src: string, ok: (v: boolean) => void) => {
      const img = new Image();
      img.onload = () => ok(true);
      img.onerror = () => ok(false);
      img.src = src;
    };
    probe("/logo.png", setLogoOk);
    probe("/baby.png", setArtOk);
  }, []);

  const caShort = `${MINT.slice(0, 6)}…${MINT.slice(-6)}`;

  const copyCa = async () => {
    await navigator.clipboard.writeText(MINT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const pages = Math.max(1, Math.ceil(events.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const pageEvents = events.slice(
    safePage * PER_PAGE,
    (safePage + 1) * PER_PAGE
  );

  return (
    <>
      <nav className="nav">
        <a href="#top" className="nav-logo">
          {logoOk ? (
            // drop logo.png into /public
            <img src="/logo.png" alt="Baby Manlet" className="nav-logo-img" />
          ) : (
            <span className="nav-logo-fallback">👶</span>
          )}
          <span className="nav-title display">$BABYMANLET</span>
        </a>
        <div className="nav-links">
          <a href="#feed">Feed</a>
          <a href="#stats">Stats</a>
          <a href="#how">How</a>
          <a href="#token">Token</a>
        </div>
        <div className="nav-spacer" />
        <a href={BUY_URL} target="_blank" rel="noopener noreferrer" className="btn">
          Buy $BABYMANLET →
        </a>
        <a href={X_URL} target="_blank" rel="noopener noreferrer" className="btn btn-x">
          X ↗
        </a>
        <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="btn btn-x">
          TG ↗
        </a>
      </nav>

      <header className="hero-wrap" id="top">
        {/* hero background = /public/hero.png */}
        <div className="hero">
          <div className="hero-badge">
            <span className="dot" />
            Live on Solana
          </div>
          <div className="hero-kicker">/ Return to Memes</div>
          <h1 className="hero-title display">
            We are the <span className="accent">Baby Manlets.</span>
          </h1>
          <p className="hero-sub">
            creator fees come in. $BABYMANLET is bought back on-chain. every
            cycle the whole bag drops on all holders. no claim site. no team
            bag. just the script.
          </p>
          <div className="hero-cta">
            <a href={BUY_URL} target="_blank" rel="noopener noreferrer" className="btn">
              Buy $BABYMANLET →
            </a>
            <div className="ca-row">
              <span className="ca-label">CA</span>
              <span className="ca-value">{caShort}</span>
              <button className="ca-copy" onClick={copyCa}>
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="section" id="feed">
        <div className="section-head">
          <div>
            <span className="section-num">/01</span>
            <h2 className="section-title display">Live Feed</h2>
          </div>
          <div className="section-side">
            <span className="dot" />
            Live
          </div>
        </div>

        <div className="feed-panel">
          <div className="feed-header">
            <span className="feed-header-left">
              <span className="dot" />
              BABYMANLET@SOLANA ~/FEED.LOG
            </span>
            <span className="feed-header-right">buys · sells · transfers</span>
          </div>

          {events.length === 0 ? (
            <div className="feed-empty">
              {"// listening for on-chain activity"}
              <span className="cursor" />
            </div>
          ) : (
            pageEvents.map((e) => (
              <div className="feed-row" key={e.sig}>
                <span
                  className={`feed-tag ${
                    e.type === "BUY" ? "buyback" : e.type === "MOVE" ? "move" : ""
                  }`}
                >
                  {e.type}
                </span>
                <span className="feed-text">{e.text}</span>
                <span className="feed-amount">{e.amount}</span>
                <a
                  className="feed-sig"
                  href={`https://solscan.io/tx/${e.sig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {e.sig.slice(0, 6)}…{e.sig.slice(-4)}
                </a>
              </div>
            ))
          )}

          <div className="feed-footer">
            <button
              className="feed-page-btn"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              ← prev
            </button>
            <span>
              PAGE {events.length ? safePage + 1 : 0} /{" "}
              {events.length ? pages : 0} · {events.length} EVENTS
            </span>
            <button
              className="feed-page-btn"
              disabled={safePage >= pages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              next →
            </button>
          </div>
        </div>
        <div className="feed-note">{"// ALL SIGS VERIFIABLE ON-CHAIN"}</div>
      </section>

      <section className="section" id="stats">
        <div className="section-head">
          <div>
            <span className="section-num">/02</span>
            <h2 className="section-title display">Stats</h2>
          </div>
          <div className="section-side">updated on-chain</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Bought Back</div>
            <div className="stat-value display">—</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Airdropped</div>
            <div className="stat-value display">—</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Holders Paid</div>
            <div className="stat-value display">—</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cycles Run</div>
            <div className="stat-value display">—</div>
          </div>
        </div>
        <div className="feed-note">{"// coming soon"}</div>
      </section>

      <section className="section" id="how">
        <div className="section-head">
          <div>
            <span className="section-num">/03</span>
            <h2 className="section-title display">How It Works</h2>
          </div>
          <div className="section-side">no team bag</div>
        </div>

        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">/ STEP 01</div>
            <div className="how-title display">Fees Roll In</div>
            <p className="how-text">
              every trade generates creator fees. they pile up in the vault.
              nobody touches them. the script watches the balance.
            </p>
          </div>
          <div className="how-card">
            <div className="how-num">/ STEP 02</div>
            <div className="how-title display">Buyback</div>
            <p className="how-text">
              when the cycle hits, the vault market-buys $BABYMANLET straight
              off the curve. on-chain. verifiable. every sig public.
            </p>
          </div>
          <div className="how-card">
            <div className="how-num">/ STEP 03</div>
            <div className="how-title display">Airdrop</div>
            <p className="how-text">
              the whole bag gets dropped on all holders. no claim site. no
              team allocation. hold $BABYMANLET, receive $BABYMANLET.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="token">
        <div className="section-head">
          <div>
            <span className="section-num">/04</span>
            <h2 className="section-title display">Token</h2>
          </div>
          <div className="section-side">the short facts</div>
        </div>

        <div className="token-grid">
          <div className="token-rows">
            <div className="token-row">
              <span className="token-key">Ticker</span>
              <span className="token-val hot">$BABYMANLET</span>
            </div>
            <div className="token-row">
              <span className="token-key">Chain</span>
              <span className="token-val">Solana</span>
            </div>
            <div className="token-row">
              <span className="token-key">Supply</span>
              <span className="token-val">1,000,000,000</span>
            </div>
            <div className="token-row">
              <span className="token-key">Tax</span>
              <span className="token-val">0 / 0</span>
            </div>
            <div className="token-row">
              <span className="token-key">Team Bag</span>
              <span className="token-val">none. just the script.</span>
            </div>
            <div className="token-row">
              <span className="token-key">CA</span>
              <span className="token-val hot">{caShort}</span>
            </div>
          </div>

          <div className="token-art">
            {artOk ? (
              // drop baby.png into /public
              <img src="/baby.png" alt="Baby Manlet" />
            ) : (
              <div className="token-art-placeholder">
                [ /public/baby.png ]
                <br />
                drop the baby here
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand display">
            We are the <span className="accent">Baby Manlets.</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className="btn btn-x">
              X ↗
            </a>
            <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="btn btn-x">
              TG ↗
            </a>
          </div>
        </div>
        <div className="footer-inner" style={{ marginTop: 18 }}>
          <div className="footer-note">
            {"// $BABYMANLET is a memecoin. memes only. not financial advice."}
          </div>
          <div className="footer-note">© 2026 baby manlet</div>
        </div>
      </footer>
    </>
  );
}
