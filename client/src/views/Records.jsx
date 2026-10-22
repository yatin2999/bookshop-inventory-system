import { useEffect, useRef, useState } from 'react';
import { useApi } from '../api.js';
import { DocumentDetail, Notice } from '../components/ui.jsx';
import { formatDate, formatDateTime, formatRupees, invoiceNumber, receiptNumber } from '../format.js';

export function Records() {
  const summary = useApi('/summary');
  const sales = useApi('/sales');
  const receipts = useApi('/receipts');
  const [open, setOpen] = useState(null);
  const detail = useApi(open ? `/${open.kind === 'sale' ? 'sales' : 'receipts'}/${open.id}` : null);
  const detailRef = useRef(null);
  const failure = summary.error ?? sales.error ?? receipts.error;

  useEffect(() => {
    if (detail.data) {
      detailRef.current?.scrollIntoView({ block: 'start' });
      detailRef.current?.querySelector('h2')?.focus();
    }
  }, [detail.data]);

  return (
    <>
      <header className="page-header">
        <h1 tabIndex={-1}>Records</h1>
      </header>
      {failure && <Notice tone="error">{failure.message}</Notice>}
      {summary.data && <Summary data={summary.data} />}

      {open && (
        <section className="section" ref={detailRef} aria-label="Selected record">
          {detail.error && <Notice tone="error">{detail.error.message}</Notice>}
          {detail.data && <DocumentDetail kind={open.kind} doc={detail.data} />}
          <div className="button-row">
            <button type="button" className="button small" onClick={() => setOpen(null)}>Close</button>
          </div>
        </section>
      )}

      <div className="grid-2">
        <section className="section" aria-labelledby="recent-sales">
          <h2 id="recent-sales">Recent sales</h2>
          {sales.data && (
            <RecordTable
              rows={sales.data}
              headings={['Invoice', 'Date', 'Copies', 'Total']}
              numeric={[2, 3]}
              cells={(sale) => [
                <button type="button" className="link-button mono" onClick={() => setOpen({ kind: 'sale', id: sale.saleId })}>
                  {invoiceNumber(sale.saleId)}
                </button>,
                formatDateTime(sale.soldAt),
                sale.units,
                formatRupees(sale.total),
              ]}
              rowKey={(sale) => sale.saleId}
              selected={(sale) => open?.kind === 'sale' && open.id === sale.saleId}
            />
          )}
        </section>
        <section className="section" aria-labelledby="recent-receipts">
          <h2 id="recent-receipts">Recent receipts</h2>
          {receipts.data && (
            <RecordTable
              rows={receipts.data}
              headings={['Receipt', 'Date', 'Supplier', 'Total']}
              numeric={[3]}
              cells={(receipt) => [
                <button type="button" className="link-button mono" onClick={() => setOpen({ kind: 'receipt', id: receipt.receiptId })}>
                  {receiptNumber(receipt.receiptId)}
                </button>,
                formatDate(receipt.receivedOn),
                receipt.supplier,
                formatRupees(receipt.total),
              ]}
              rowKey={(receipt) => receipt.receiptId}
              selected={(receipt) => open?.kind === 'receipt' && open.id === receipt.receiptId}
            />
          )}
        </section>
      </div>

      {summary.data && (
        <section className="section" aria-labelledby="top-sellers">
          <h2 id="top-sellers">Top sellers</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Book</th>
                  <th scope="col" className="num">Copies sold</th>
                  <th scope="col" className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.data.topSellers.map((book) => (
                  <tr key={book.bookId}>
                    <td>{book.title}</td>
                    <td className="num">{book.units}</td>
                    <td className="num">{formatRupees(book.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function Summary({ data }) {
  const figures = [
    ['Sales', data.sales.invoices],
    ['Copies sold', data.sales.units],
    ['Revenue', formatRupees(data.sales.revenue)],
    ['Receipts', data.receipts.receipts],
    ['Purchases', formatRupees(data.receipts.cost)],
  ];
  return (
    <dl className="figures">
      {figures.map(([label, value]) => (
        <div className="figure" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordTable({ rows, headings, numeric, cells, rowKey, selected }) {
  if (rows.length === 0) {
    return <p className="empty">No records found.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            {headings.map((heading, index) => (
              <th scope="col" key={heading} className={numeric.includes(index) ? 'num' : undefined}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={selected(row) ? 'is-selected' : undefined}>
              {cells(row).map((cell, index) => (
                <td key={index} className={numeric.includes(index) ? 'num' : undefined}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
