// All money is stored in paise. Display in Indian format (₹1,00,000).
export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * 100)
export const paiseToRupees = (paise) => Number(paise) / 100

export const formatINR = (paise) =>
  '₹' + paiseToRupees(paise).toLocaleString('en-IN', { maximumFractionDigits: 0 })

// Points → rupee value (paise) for wallet accounting, per platform config.
export const pointsToPaise = (points, pointToRupee = 1) =>
  Math.round(Number(points) * Number(pointToRupee) * 100)
