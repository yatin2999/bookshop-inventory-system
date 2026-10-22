import { useState } from 'react';
import { api } from '../api.js';
import { BookPicker } from '../components/BookPicker.jsx';
import { DocumentDetail, Notice } from '../components/ui.jsx';
import { formatRupees, fromPaise, isQuantity, toPaise } from '../format.js';

export function Checkout() {
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);

  const ready = cart.length > 0 && cart.every((line) => isQuantity(line.quantity));
  const estimate = ready
    ? fromPaise(cart.reduce((sum, line) => sum + BigInt(Number(line.quantity)) * toPaise(line.price), 0n))
    : null;

  const updateLine = (bookId, changes) =>
    setCart((current) => current.map((line) => (line.bookId === bookId ? { ...line, ...changes } : line)));

  function addBook(book) {
    setInvoice(null);
    setError(null);
    setCart((current) => [...current, { bookId: book.bookId, title: book.title, price: book.price, stock: book.stock, quantity: '1' }]);
  }

  async function record() {
    setSaving(true);
    setError(null);
    try {
      const saved = await api.post('/sales', {
        lines: cart.map((line) => ({ bookId: line.bookId, quantity: Number(line.quantity) })),
      });
      setInvoice(saved);
      setCart([]);
    } catch (failure) {
      setError(failure);
      if (failure.code === 'INSUFFICIENT_STOCK') {
        for (const short of failure.details.lines) {
          updateLine(short.bookId, { stock: short.available });
        }
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1 tabIndex={-1}>Checkout</h1>
      </header>
      {invoice && (
        <div className="stack">
          <Notice tone="success">Sale recorded.</Notice>
          <DocumentDetail kind="sale" doc={invoice} />
        </div>
      )}
      <div className="workspace">
        <section className="panel" aria-labelledby="cart-heading">
          <h2 id="cart-heading">Cart</h2>
          {cart.length > 0 ? (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col">Book</th>
                    <th scope="col" className="num">Price</th>
                    <th scope="col" className="num">Quantity</th>
                    <th scope="col"><span className="visually-hidden">Remove</span></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((line) => (
                    <tr key={line.bookId}>
                      <td>
                        {line.title}
                        <span className={`cell-sub${isQuantity(line.quantity) && Number(line.quantity) > line.stock ? ' warning' : ''}`}>
                          {line.stock} in stock
                        </span>
                      </td>
                      <td className="num">{formatRupees(line.price)}</td>
                      <td className="num">
                        <input
                          className="num"
                          aria-label={`Quantity of ${line.title}`}
                          inputMode="numeric"
                          value={line.quantity}
                          aria-invalid={isQuantity(line.quantity) ? undefined : true}
                          onChange={(event) => updateLine(line.bookId, { quantity: event.target.value })}
                        />
                      </td>
                      <td className="actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Remove ${line.title}`}
                          onClick={() => setCart((current) => current.filter((other) => other.bookId !== line.bookId))}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty">The cart is empty.</p>
          )}
          <BookPicker label="Add a book" chosenIds={cart.map((line) => line.bookId)} onPick={addBook} />
        </section>
        <aside className="panel" aria-labelledby="sale-heading">
          <h2 id="sale-heading">Sale</h2>
          <div className="total-line">
            <span>Estimated total</span>
            <span className="amount">{formatRupees(estimate)}</span>
          </div>
          <p className="total-note">{cart.length > 0 && !ready ? 'Enter a quantity for each book.' : 'The recorded invoice shows the final amount.'}</p>
          {error && (
            <Notice tone={error.uncertain ? 'warning' : 'error'} title={error.code === 'INSUFFICIENT_STOCK' ? 'Not enough stock' : undefined}>
              {error.uncertain && 'The sale may have been recorded. Check Records before trying again.'}
              {error.code === 'INSUFFICIENT_STOCK' && (
                <ul>
                  {error.details.lines.map((line) => (
                    <li key={line.bookId}>{line.title}: {line.available} available, {line.requested} requested</li>
                  ))}
                </ul>
              )}
              {!error.uncertain && error.code !== 'INSUFFICIENT_STOCK' && error.message}
            </Notice>
          )}
          <div className="button-row">
            <button type="button" className="button primary" disabled={!ready || saving} onClick={record}>
              {saving ? 'Recording…' : 'Record sale'}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
