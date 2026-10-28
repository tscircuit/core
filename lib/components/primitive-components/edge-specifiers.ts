export const edgeSpecifiers = [
  "leftedge",
  "rightedge",
  "topedge",
  "bottomedge",
  "center",
] as const

export type EdgeSpecifier = (typeof edgeSpecifiers)[number]
