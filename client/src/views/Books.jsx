import { useState } from 'react';
import { api, useApi } from '../api.js';
import { Field, Notice } from '../components/ui.jsx';
import { formatRupees, isPositiveAmount } from '../format.js';

export function Books() {
  const [term, setTerm] = useState('');
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState(null);
  const q = term.trim();
  const books = useApi(q ? `/books?q=${encodeURIComponent(q)}` : '/books', { delay: 200, reload });
  const categories = useApi('/categories').data ?? [];
  const authors = useApi('/authors').data ?? [];

  function startEditing(book) {
    setEditing(book);
    setMessage(null);
  }

  function saved(isNew) {
    setEditing(null);
    setMessage(isNew ? 'Book added.' : 'Book updated.');
    setReload((count) => count + 1);
  }

  return (
    <>
      <header className="page-header">
        <h1 tabIndex={-1}>Books</h1>
        <button type="button" className="button primary" onClick={() => startEditing('new')}>Add book</button>
      </header>
      {message && <Notice tone="success">{message}</Notice>}
      {editing && (
        <BookForm
          key={editing === 'new' ? 'new' : editing.bookId}
          book={editing === 'new' ? null : editing}
          categories={categories}
          authors={authors}
          onSaved={saved}
          onCancel={() => setEditing(null)}
        />
      )}
      <section className="section" aria-labelledby="catalogue-heading">
        <div className="list-bar">
          <h2 id="catalogue-heading">Catalogue</h2>
          <Field label="Search" className="search">
            {(props) => (
              <input {...props} type="search" placeholder="Title or ISBN" value={term} onChange={(event) => setTerm(event.target.value)} />
            )}
          </Field>
        </div>
        {books.error && <Notice tone="error">{books.error.message}</Notice>}
        {books.data && books.data.length === 0 && <p className="empty">No books found.</p>}
        {books.data && books.data.length > 0 && (
          <div className={`table-wrap${books.loading ? ' is-busy' : ''}`}>
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">ISBN</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="num">Price</th>
                  <th scope="col" className="num">In stock</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {books.data.map((book) => (
                  <tr key={book.bookId}>
                    <td>
                      {book.title}
                      <span className="cell-sub">{book.authors}</span>
                    </td>
                    <td className="mono">{book.isbn}</td>
                    <td>{book.category}</td>
                    <td className="num">{formatRupees(book.price)}</td>
                    <td className="num">{book.stock}</td>
                    <td className="actions">
                      <button type="button" className="button small" aria-label={`Edit ${book.title}`} onClick={() => startEditing(book)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function BookForm({ book, categories, authors, onSaved, onCancel }) {
  const isNew = book === null;
  const [form, setForm] = useState({
    title: book?.title ?? '',
    isbn: '',
    categoryId: book ? String(book.categoryId) : '',
    price: book?.price ?? '',
    authorIds: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const update = (changes) => setForm((current) => ({ ...current, ...changes }));

  const problems = {
    title: form.title.trim() ? null : 'Enter a title.',
    isbn: isNew && !/^97[89]\d{10}$/.test(form.isbn.replace(/[\s-]/g, '')) ? 'Enter 13 digits starting with 978 or 979.' : null,
    categoryId: form.categoryId ? null : 'Choose a category.',
    price: isPositiveAmount(form.price) ? null : 'Enter a price above zero, such as 349.50.',
    authorIds: isNew && form.authorIds.length === 0 ? 'Choose at least one author.' : null,
  };
  const shown = (field) => (submitted ? problems[field] : null);

  function toggleAuthor(authorId) {
    update({
      authorIds: form.authorIds.includes(authorId)
        ? form.authorIds.filter((id) => id !== authorId)
        : [...form.authorIds, authorId],
    });
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(problems).some(Boolean)) {
      return;
    }
    setSaving(true);
    setError(null);
    const details = { title: form.title, categoryId: Number(form.categoryId), price: form.price.trim() };
    try {
      if (isNew) {
        await api.post('/books', { ...details, isbn: form.isbn, authorIds: form.authorIds });
      } else {
        await api.patch(`/books/${book.bookId}`, details);
      }
      onSaved(isNew);
    } catch (failure) {
      setError(failure);
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit} noValidate aria-labelledby="book-form-heading">
      <h2 id="book-form-heading">{isNew ? 'Add book' : `Edit ${book.title}`}</h2>
      {!isNew && (
        <p className="muted">
          ISBN <span className="mono">{book.isbn}</span> · {book.authors}
        </p>
      )}
      <div className="form-grid">
        <Field label="Title" error={shown('title')} className="span-all">
          {(props) => <input {...props} value={form.title} maxLength={200} autoFocus onChange={(event) => update({ title: event.target.value })} />}
        </Field>
        {isNew && (
          <Field label="ISBN" error={shown('isbn')}>
            {(props) => <input {...props} value={form.isbn} inputMode="numeric" placeholder="978…" onChange={(event) => update({ isbn: event.target.value })} />}
          </Field>
        )}
        <Field label="Category" error={shown('categoryId')}>
          {(props) => (
            <select {...props} value={form.categoryId} onChange={(event) => update({ categoryId: event.target.value })}>
              <option value="">Choose…</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Price (₹)" error={shown('price')}>
          {(props) => <input {...props} className="money" value={form.price} inputMode="decimal" onChange={(event) => update({ price: event.target.value })} />}
        </Field>
      </div>
      {isNew && (
        <fieldset className="author-options" aria-invalid={shown('authorIds') ? true : undefined}>
          <legend className="field-label">Authors</legend>
          <div className="author-grid">
            {authors.map((author) => (
              <label key={author.authorId} className="check">
                <input type="checkbox" checked={form.authorIds.includes(author.authorId)} onChange={() => toggleAuthor(author.authorId)} />
                {author.name}
              </label>
            ))}
          </div>
          {shown('authorIds') && <p className="field-error">{shown('authorIds')}</p>}
        </fieldset>
      )}
      {error && <Notice tone="error">{error.message}</Notice>}
      <div className="button-row">
        <button type="submit" className="button primary" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add book' : 'Save changes'}</button>
        <button type="button" className="button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}
