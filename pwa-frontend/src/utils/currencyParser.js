export function parseBrazilianCurrency(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const text = String(value ?? '').trim().replace(/^R\$\s*/, '');
  if (!text) return 0;
  let normalized;
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(text)) {
    normalized = text.replaceAll('.', '').replace(',', '.');
  } else if (/^-?\d+(?:,\d{1,2})?$/.test(text)) {
    normalized = text.replace(',', '.');
  } else if (/^-?\d+\.\d{1,2}$/.test(text)) {
    normalized = text;
  } else return NaN;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : NaN;
}
