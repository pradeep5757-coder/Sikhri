import logo from '../assets/sikhri-logo.png';

const NAV = ['Articles & Blogs', 'Videos', 'Podcasts', 'Events', 'Ask', 'Sidak'];

/**
 * Stand-in for the sikhri.org page, only so the POC shows the button and popup in context.
 * On Webflow the real site replaces this; only the button + popup are embedded.
 */
export function DemoPage({ donateButton }) {
  return (
    <div className="demo">
      <header className="demo-nav">
        <img src={logo} alt="SikhRI" className="demo-logo" />
        <nav aria-label="Main">
          {NAV.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </nav>
        <div className="demo-cta">{donateButton}</div>
      </header>
      <section className="demo-hero">
        <div>
          <h1>Your Generous Contribution Makes A Difference</h1>
          <p className="demo-sub">Allow Us To Inspire Seekers On Every Path</p>
          <a href="#donate" className="demo-link">
            How to donate →
          </a>
        </div>
      </section>
      <section className="demo-copy">
        <h2>SikhRI is a global non-profit organization based in North America, committed to supporting seekers globally to live a Guru-inspired life.</h2>
        <p>Test page for the new donation form. Click Donate (or pick your region at the bottom on a phone) to open it.</p>
      </section>
    </div>
  );
}
