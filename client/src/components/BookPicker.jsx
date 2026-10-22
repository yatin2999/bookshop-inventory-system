import { useState } from 'react';
import { useApi } from '../api.js';
import { formatRupees } from '../format.js';
import { Field } from './ui.jsx';

const SHOWN = 8;

export function BookPicker({ label, chosenIds, onPick, showStock = true }) {
  const [term, setTerm] = useState('');
  const q = term.trim();
  const path = q ? `/books?q=${encodeURIComponent(q)}` : null;
  const result = useApi(path, { delay: 200 });
  const current = path !== null && result.path === path && !result.loading;
  const books = current ? result.data : [];

  return (
    <div>
      <Field label={label} hint="Search by title or ISBN.">
        {(props) => (
          <input {...props} type="search" value={term} autoComplete="off" onChange={(event) => setTerm(event.target.value)} />
        )}
      </Field>
      {result.error && <p className="field-error">{result.error.message}</p>}
      {current && books.length === 0 && <p className="picker-status">No books found.</p>}
      {books.length > 0 && (
        <ul className="picker-results" aria-label="Matching books">
          {books.slice(0, SHOWN).map((book) => {
            const chosen = chosenIds.includes(book.bookId);
            return (
              <li key={book.bookId}>
                <button
                  type="button"
                  className="picker-option"
                  disabled={chosen}
                  onClick={() => {
                    onPick(book);
                    setTerm('');
                  }}
                >
                  <span>
                    {book.title}
                    <span className="muted"> · {book.authors}</span>
                  </span>
                  <span className="side">{formatRupees(book.price)}</span>
                  <span className="muted mono">{book.isbn}</span>
                  <span className="side muted">{chosen ? 'Added' : showStock && `${book.stock} in stock`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {books.length > SHOWN && <p className="picker-status">Showing {SHOWN} of {books.length}. Type more to narrow the list.</p>}
    </div>
  );
}
