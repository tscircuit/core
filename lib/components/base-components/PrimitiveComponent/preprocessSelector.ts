export const preprocessSelector = (selector: string) => {
  return selector
    .replace(/ pin/g, " port")
    .replace(/ subcircuit\./g, " group[isSubcircuit=true]")
    .replace(/([^ ])\>([^ ])/g, "$1 > $2")
    .trim()
}
