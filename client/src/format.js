const AMOUNT = /^(\d{1,8})(?:\.(\d{1,2}))?$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toPaise(text) {
  const match = AMOUNT.exec(String(text ?? '').trim());
  return match ? BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0')) : null;
}

export function fromPaise(paise) {
  const digits = paise.toString().padStart(3, '0');
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export const isPositiveAmount = (text) => (toPaise(text) ?? 0n) > 0n;

export const isQuantity = (text) => /^\d{1,4}$/.test(String(text).trim()) && Number(text) > 0;

export function formatRupees(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '–';
  }
  const [whole, fraction = ''] = String(amount).split('.');
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+$)/g, ',')},${lastThree}` : lastThree;
  return `₹${grouped}.${fraction.padEnd(2, '0')}`;
}

export function formatDate(value) {
  if (!value) {
    return '–';
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export const formatDateTime = (value) => (value ? `${formatDate(value)}, ${value.slice(11, 16)}` : '–');

export const invoiceNumber = (saleId) => `INV-${String(saleId).padStart(6, '0')}`;
export const receiptNumber = (receiptId) => `RCV-${String(receiptId).padStart(6, '0')}`;
