export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const invalid = (message) => new ApiError(400, 'INVALID', message);
export const notFound = (message) => new ApiError(404, 'NOT_FOUND', message);

const MAX_ID = 2147483647;
const MAX_QUANTITY = 9999;
const MAX_LINES = 50;

function wholeNumber(value, label, max) {
  const number = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  if (!Number.isSafeInteger(number) || number < 1 || number > max) {
    throw invalid(`${label} must be a whole number from 1 to ${max}.`);
  }
  return number;
}

export const id = (value, label) => wholeNumber(value, label, MAX_ID);
export const quantity = (value, label) => wholeNumber(value, label, MAX_QUANTITY);

export function amount(value, label) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^\d{1,8}(\.\d{1,2})?$/.test(text.trim())) {
    throw invalid(`${label} must be an amount with at most two decimal places, such as 349.50.`);
  }
  const [whole, fraction = ''] = text.trim().split('.');
  const result = `${Number(whole)}.${fraction.padEnd(2, '0')}`;
  if (result === '0.00') {
    throw invalid(`${label} must be greater than zero.`);
  }
  return result;
}

export function text(value, label, maxLength) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (result === '') {
    throw invalid(`${label} is required.`);
  }
  if (result.length > maxLength) {
    throw invalid(`${label} must be at most ${maxLength} characters.`);
  }
  return result;
}

export function isbn(value) {
  const digits = typeof value === 'string' ? value.replace(/[\s-]/g, '') : '';
  if (!/^97[89]\d{10}$/.test(digits)) {
    throw invalid('ISBN must be 13 digits starting with 978 or 979.');
  }
  return digits;
}

export function idList(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10) {
    throw invalid(`Choose from 1 to 10 ${label.toLowerCase()}.`);
  }
  const ids = value.map((item) => id(item, label));
  if (new Set(ids).size !== ids.length) {
    throw invalid(`${label} must not repeat.`);
  }
  return ids;
}

export function lines(value, withCost) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_LINES) {
    throw invalid(`Add from 1 to ${MAX_LINES} books.`);
  }
  const seen = new Set();
  const result = value.map((line, index) => {
    const label = `Line ${index + 1}`;
    const bookId = id(line?.bookId, `${label} book`);
    if (seen.has(bookId)) {
      throw invalid('Each book can appear only once.');
    }
    seen.add(bookId);
    const entry = { bookId, quantity: quantity(line.quantity, `${label} quantity`) };
    if (withCost) {
      entry.unitCost = amount(line.unitCost, `${label} unit cost`);
    }
    return entry;
  });
  return result.sort((a, b) => a.bookId - b.bookId);
}
