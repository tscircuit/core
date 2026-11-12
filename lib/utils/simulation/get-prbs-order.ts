const PRBS_ORDER: Record<string, number | undefined> = {
  prbs7: 7,
  prbs15: 15,
  prbs31: 31,
}

export function getPrbsOrder(pattern: string) {
  return PRBS_ORDER[pattern]
}
