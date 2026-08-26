export function formatPKR(
  value: number | string | null | undefined,
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Rs —";
  }

  return `Rs ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}