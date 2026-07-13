export function stopStayLabel(nights: number): string {
  if (nights === 0) return "Transfer stop";
  return nights === 1 ? "1 night" : `${nights} nights`;
}
