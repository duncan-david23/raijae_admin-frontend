// src/utils/currency.js
export const formatCurrency = (amount, decimals = 2) => {
  const value = Number(amount);
  if (!isFinite(value) || Number.isNaN(value)) return `GHC ${Number(0).toFixed(decimals)}`;
  return `GHC ${value.toFixed(decimals)}`;
};

export const formatCurrencySymbol = (amount, decimals = 2) => {
  const value = Number(amount);
  if (!isFinite(value) || Number.isNaN(value)) return `₵${Number(0).toFixed(decimals)}`;
  return `₵${value.toFixed(decimals)}`;
};

export default formatCurrency;