import { useEffect, useRef, useState } from 'react';
import { Books } from './views/Books.jsx';
import { Checkout } from './views/Checkout.jsx';
import { Receive } from './views/Receive.jsx';
import { Records } from './views/Records.jsx';

const SECTIONS = [
  { key: 'books', label: 'Books' },
  { key: 'receive', label: 'Receive' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'records', label: 'Records' },
];

const focusHeading = () => document.querySelector('main h1')?.focus();

export function App() {
  const [section, setSection] = useState('books');
  const firstRender = useRef(true);

  const label = SECTIONS.find((item) => item.key === section).label;
  useEffect(() => {
    document.title = `${label} · Bookshop`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    focusHeading();
  }, [label]);

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          focusHeading();
        }}
      >
        Skip to content
      </a>
      <header className="masthead">
        <div className="masthead-inner">
          <div className="brand">
            <span className="brand-mark">Bookshop</span>
            <span className="brand-sub">Inventory &amp; Sales</span>
          </div>
          <nav className="main-nav" aria-label="Main">
            <ul>
              {SECTIONS.map((item) => (
                <li key={item.key}>
                  <button type="button" aria-current={item.key === section ? 'page' : undefined} onClick={() => setSection(item.key)}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main">
        {section === 'books' && <Books />}
        {section === 'receive' && <Receive />}
        {section === 'checkout' && <Checkout />}
        {section === 'records' && <Records />}
      </main>
    </>
  );
}
