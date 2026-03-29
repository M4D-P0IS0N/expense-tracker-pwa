export function parseBrazilianCurrency(valueStr) {
  if (!valueStr) return 0;

  let normalizedValue = String(valueStr).trim();
  if (normalizedValue === '') return 0;

  if (!Number.isNaN(normalizedValue) && !normalizedValue.includes(',')) {
    return parseFloat(normalizedValue);
  }

  normalizedValue = normalizedValue.replace(/[^\d.,-]/g, '');

  const commaCount = (normalizedValue.match(/,/g) || []).length;
  const dotCount = (normalizedValue.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    const lastCommaIndex = normalizedValue.lastIndexOf(',');
    const lastDotIndex = normalizedValue.lastIndexOf('.');
    if (lastCommaIndex > lastDotIndex) {
      normalizedValue = normalizedValue.replace(/\./g, '').replace(',', '.');
    } else {
      normalizedValue = normalizedValue.replace(/,/g, '');
    }
  } else if (commaCount > 0) {
    normalizedValue = commaCount === 1
      ? normalizedValue.replace(',', '.')
      : normalizedValue.replace(/,/g, '');
  } else if (dotCount === 1) {
    const parts = normalizedValue.split('.');
    if (parts[1].length === 3) {
      normalizedValue = normalizedValue.replace('.', '');
    }
  } else if (dotCount > 1) {
    normalizedValue = normalizedValue.replace(/\./g, '');
  }

  const parsedNumber = parseFloat(normalizedValue);
  return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
}
