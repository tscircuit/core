import {
  hexSocketBoltDimensions,
  parseModelString,
} from "@tscircuit/modelprinter"
import type { AssemblyBolt } from "./AssemblyBolt"
import { resolveAssemblyModel } from "./resolve-assembly-model"

/** Expand convenience names at the CAD boundary so modelcdn receives its
 * existing hexsocketbolt model, including with older modelprinter versions.
 * Length is under the head, in mm; bare shorthand means M3 x 10 socket head.
 */
const boltModelString = (value: string) => {
  const match = value.trim().match(/^(?:m(\d+(?:\.\d+)?)bolt|bolt)(?:_(.*))?$/i)
  if (!match) return value
  const tokens = match[2] === undefined ? [] : match[2].split("_")
  if (match[1]) tokens.unshift(`m${match[1]}`)
  else if (!tokens.some((token) => /^m[\d.]/i.test(token))) tokens.unshift("m3")
  if (!tokens.some((token) => /^(?:l|length)(?:[^a-z]|$)/i.test(token)))
    tokens.push("l10mm")
  const props = parseModelString(`hexsocketbolt_${tokens.join("_")}`)
  if (props.fn !== "hexsocketbolt")
    throw new Error("Expected a socket-head bolt")
  return `hexsocketbolt_${props.metricSize.toLowerCase()}_l${props.length}mm${props.showThreads ? "" : "_nothreads"}`
}

export const resolveAssemblyBoltModel = (bolt: AssemblyBolt) => {
  const props = bolt._parsedProps
  try {
    if (props.model !== undefined)
      return resolveAssemblyModel({ model: boltModelString(props.model) })
    if (props.diameter === undefined) return resolveAssemblyModel(props)
    const head = props.headType ?? "socket"
    const fn = {
      socket: "hexsocketbolt",
      hex: "hexbolt",
      pan: "panscrew",
      countersunk: "flatheadscrew",
    }[head]
    let model = `${fn}_m${props.diameter}_l${props.length}mm`
    if (props.threadPitch !== undefined) {
      if (head === "socket") {
        const standard =
          hexSocketBoltDimensions[
            `M${props.diameter}` as keyof typeof hexSocketBoltDimensions
          ]
        if (props.threadPitch !== standard?.threadPitch)
          throw new Error(
            "Socket-head bolts require the standard coarse thread pitch; supply cadModel for a custom thread",
          )
      } else model += `_threadpitch${props.threadPitch}mm`
    }
    parseModelString(model)
    return resolveAssemblyModel({ model })
  } catch {
    throw new Error(
      `Bolt "${bolt.name}" has an unsupported model or dimensions; use a supported modelprinter bolt or supply cadModel`,
    )
  }
}
