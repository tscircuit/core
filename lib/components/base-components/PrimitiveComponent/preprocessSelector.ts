export const preprocessSelector = (selector: string) => {
  if (/net\.[^\s>]*\./.test(selector)) {
    throw new Error(
      'Net names cannot contain a period, try using "sel.net..." to autocomplete with conventional net names, e.g. V3_3',
    )
  }
  if (/net\.[0-9]/.test(selector)) {
    const match = selector.match(/net\.([^ >]+)/)
    const netName = match ? match[1] : ""
    throw new Error(
      `Net name "${netName}" cannot start with a number, try using a prefix like "VBUS1"`,
    )
  }
  return selector
    .replace(/ pin/g, " port")
    .replace(/ subcircuit\./g, " group[isSubcircuit=true]")
    .replace(/([^ ])\>([^ ])/g, "$1 > $2")
    .replace(
      /(^|[ >])(?!pin\.)(?!port\.)(?!net\.)([A-Z][A-Za-z0-9_-]*)\.([A-Za-z0-9_-]+)/g,
      (_, sep, name, pin) => {
        const pinPart = /^\d+$/.test(pin) ? `pin${pin}` : pin
        return `${sep}.${name} > .${pinPart}`
      },
    )
    .trim()
}
