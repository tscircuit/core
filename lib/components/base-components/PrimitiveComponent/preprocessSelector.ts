export const preprocessSelector = (selector: string) => {
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
