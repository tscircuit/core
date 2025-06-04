export const preprocessSelector = (selector: string) => {
  if (/net\.[^\s>]*\./.test(selector)) {
    throw new Error(
      'Net names cannot contain a period, try using "sel.net..." to autocomplete with conventional net names, e.g. V3_3',
    )
  }
  return selector
    .replace(/ pin/g, " port")
    .replace(/ subcircuit\./g, " group[isSubcircuit=true]")
    .replace(/([^ ])\>([^ ])/g, "$1 > $2")
    .trim()
}
