export const preprocessSelector = (selector: string) => {
  return selector
    .replace(/ pin/g, " port")
    .replace(/ subcircuit\./g, " group[isSubcircuit=true]")
    .trim()
}
