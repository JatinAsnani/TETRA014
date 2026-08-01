export function calculateGst(amount, rate, sameState = true) {
  const gstAmount = Math.round(amount * rate / 100 * 100) / 100
  if (sameState) {
    return {
      cgst: Math.round(gstAmount / 2 * 100) / 100,
      sgst: Math.round(gstAmount / 2 * 100) / 100,
      igst: 0,
      totalGst: gstAmount,
    }
  }
  return { cgst: 0, sgst: 0, igst: gstAmount, totalGst: gstAmount }
}

export function calculateLineTotal(qty, rate, discountPct, gstRate, sameState) {
  const sub = qty * rate
  const afterDisc = sub - sub * (discountPct || 0) / 100
  const gst = calculateGst(afterDisc, gstRate || 18, sameState)
  return {
    taxable: Math.round(afterDisc * 100) / 100,
    ...gst,
    total: Math.round((afterDisc + gst.totalGst) * 100) / 100,
  }
}
