export function parseBrazilianCurrency(valueStr) {
  if (!valueStr) return 0;
  let normalizedCurrencyValue = String(valueStr).trim();
  if (normalizedCurrencyValue === '') return 0;

  if (!Number.isNaN(Number(normalizedCurrencyValue)) && !normalizedCurrencyValue.includes(',')) {
    return parseFloat(normalizedCurrencyValue);
  }

  normalizedCurrencyValue = normalizedCurrencyValue.replace(/[^\d.,-]/g, '');

  const commaCount = (normalizedCurrencyValue.match(/,/g) || []).length;
  const dotCount = (normalizedCurrencyValue.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    const lastCommaIndex = normalizedCurrencyValue.lastIndexOf(',');
    const lastDotIndex = normalizedCurrencyValue.lastIndexOf('.');
    if (lastCommaIndex > lastDotIndex) {
      normalizedCurrencyValue = normalizedCurrencyValue.replace(/\./g, '').replace(',', '.');
    } else {
      normalizedCurrencyValue = normalizedCurrencyValue.replace(/,/g, '');
    }
  } else if (commaCount > 0) {
    if (commaCount === 1) {
      normalizedCurrencyValue = normalizedCurrencyValue.replace(',', '.');
    } else {
      normalizedCurrencyValue = normalizedCurrencyValue.replace(/,/g, '');
    }
  } else if (dotCount === 1) {
    const currencySegments = normalizedCurrencyValue.split('.');
    if (currencySegments[1].length === 3) {
      normalizedCurrencyValue = normalizedCurrencyValue.replace('.', '');
    }
  } else if (dotCount > 1) {
    normalizedCurrencyValue = normalizedCurrencyValue.replace(/\./g, '');
  }

  const parsedCurrencyValue = parseFloat(normalizedCurrencyValue);
  return Number.isNaN(parsedCurrencyValue) ? 0 : parsedCurrencyValue;
}
