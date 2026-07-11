import { getInvalidNetNameError } from "lib/utils/nets/getInvalidNetNameError"
import { reportInvalidNetName } from "lib/utils/nets/reportInvalidNetName"
import type { PrimitiveComponent } from "./PrimitiveComponent"

export const preprocessSelector = (
  selector: string,
  component?: PrimitiveComponent,
) => {
  const invalidNetNameError = getInvalidNetNameError(
    selector,
    () => component?.componentName,
  )
  if (invalidNetNameError) {
    // Surface the bad net name as a recoverable circuit-json error attached to
    // the component instead of throwing (which would abort the whole render).
    // When no component/db is available, reportInvalidNetName re-throws so the
    // problem isn't silently swallowed.
    reportInvalidNetName(component, selector, invalidNetNameError)
    // Return the selector unchanged; it simply won't match any component.
    return selector
  }
  return selector
    .replace(/ pin(?=[\d.])/g, " port")
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
