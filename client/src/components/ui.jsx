import { useId } from 'react';
import { formatDate, formatDateTime, formatRupees, invoiceNumber, receiptNumber } from '../format.js';

export function Notice({ tone = 'info', title, children }) {
  return (
    <div className={`notice notice-${tone}`} role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}>
      {title && <strong className="notice-title">{title}</strong>}
      {children}
    </div>
  );
}

export function Field({ label, hint, error, className = '', children }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

export function DocumentDetail({ kind, doc }) {
  const sale = kind === 'sale';
  return (
    <article className="document">
      <header className="document-head">
        <h2 tabIndex={-1}>{sale ? invoiceNumber(doc.saleId) : receiptNumber(doc.receiptId)}</h2>
        <p className="muted">
          {sale ? formatDateTime(doc.soldAt) : `${formatDate(doc.receivedOn)} · ${doc.supplier}`}
        </p>
      </header>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Book</th>
              <th scope="col" className="num">Qty</th>
              <th scope="col" className="num">{sale ? 'Price' : 'Unit cost'}</th>
              <th scope="col" className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((line) => (
              <tr key={line.bookId}>
                <td>
                  {line.title}
                  <span className="cell-sub mono">{line.isbn}</span>
                </td>
                <td className="num">{line.quantity}</td>
                <td className="num">{formatRupees(sale ? line.unitPrice : line.unitCost)}</td>
                <td className="num">{formatRupees(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total</td>
              <td className="num">{formatRupees(doc.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </article>
  );
}
