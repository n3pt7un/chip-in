/**
 * Format a chip amount using the user's preferred currency symbol.
 * Falls back to the raw number if no symbol is set.
 */
export function formatChips(amount: number, currencySymbol = 'chips'): string {
  if (currencySymbol === 'chips') return String(amount)
  return `${currencySymbol}${amount.toLocaleString()}`
}
