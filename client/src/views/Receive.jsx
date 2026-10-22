import { useState } from 'react';
import { api, useApi } from '../api.js';
import { BookPicker } from '../components/BookPicker.jsx';
import { DocumentDetail, Field, Notice } from '../components/ui.jsx';
import { formatRupees, fromPaise, isPositiveAmount, isQuantity, toPaise } from '../format.js';

export function Receive() {
  const suppliers = useApi('/suppliers').data ?? [];
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const valid = (line) => isQuantity(line.quantity) && isPositiveAmount(line.unitCost);
  const ready = supplierId !== '' && lines.length > 0 && lines.every(valid);
  const total = lines.every(valid) && lines.length > 0
    ? fromPaise(lines.reduce((sum, line) => sum + BigInt(Number(line.quantity)) * toPaise(line.unitCost), 0n))
    : null;

  const updateLine = (bookId, changes) =>
    setLines((current) => current.map((line) => (line.bookId === bookId ? { ...line, ...changes } : line)));

  function addBook(book) {
    setReceipt(null);
    setLines((current) => [...current, { bookId: book.bookId, title: book.title, isbn: book.isbn, quantity: '1', unitCost: '' }]);
  }

  async function record() {
    setSaving(true);
    setError(null);
    try {
      const saved = await api.post('/receipts', {
        supplierId: Number(supplierId),
        lines: lines.map((line) => ({ bookId: line.bookId, quantity: Number(line.quantity), unitCost: line.unitCost.trim() })),
      });
      setReceipt(saved);
      setLines([]);
      setSupplierId('');
    } catch (failure) {
      setError(failure);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1 tabIndex={-1}>Receive</h1>
      </header>
      {receipt && (
        <div className="stack">
          <Notice tone="success">Receipt recorded.</Notice>
          <DocumentDetail kind="receipt" doc={receipt} />
        </div>
      )}
      <div className="workspace">
        <section className="panel" aria-labelledby="receipt-books">
          <h2 id="receipt-books">Books received</h2>
          {lines.length > 0 ? (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col">Book</th>
                    <th scope="col" className="num">Quantity</th>
                    <th scope="col" className="num">Unit cost (₹)</th>
                    <th scope="col"><span className="visually-hidden">Remove</span></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.bookId}>
                      <td>
                        {line.title}
                        <span className="cell-sub mono">{line.isbn}</span>
                      </td>
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
                      <td className="num">
                        <input
                          className="money"
                          aria-label={`Unit cost of ${line.title}`}
                          inputMode="decimal"
                          placeholder="0.00"
                          value={line.unitCost}
                          aria-invalid={line.unitCost === '' || isPositiveAmount(line.unitCost) ? undefined : true}
                          onChange={(event) => updateLine(line.bookId, { unitCost: event.target.value })}
                        />
                      </td>
                      <td className="actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Remove ${line.title}`}
                          onClick={() => setLines((current) => current.filter((other) => other.bookId !== line.bookId))}
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
            <p className="empty">No books yet.</p>
          )}
          <BookPicker label="Add a book" chosenIds={lines.map((line) => line.bookId)} onPick={addBook} showStock={false} />
        </section>
        <aside className="panel" aria-labelledby="receipt-summary">
          <h2 id="receipt-summary">Receipt</h2>
          <Field label="Supplier">
            {(props) => (
              <select {...props} value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                <option value="">Choose…</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>{supplier.name}</option>
                ))}
              </select>
            )}
          </Field>
          <div className="total-line">
            <span>Total</span>
            <span className="amount">{formatRupees(total)}</span>
          </div>
          {lines.length > 0 && !lines.every(valid) && <p className="total-note">Enter a quantity and unit cost for each book.</p>}
          {error && (
            <Notice tone={error.uncertain ? 'warning' : 'error'}>
              {error.uncertain ? 'The receipt may have been recorded. Check Records before trying again.' : error.message}
            </Notice>
          )}
          <div className="button-row">
            <button type="button" className="button primary" disabled={!ready || saving} onClick={record}>
              {saving ? 'Recording…' : 'Record receipt'}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
