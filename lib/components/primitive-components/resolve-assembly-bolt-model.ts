import {
  hexSocketBoltDimensions,
  parseModelString,
} from "@tscircuit/modelprinter"
import type { AssemblyBolt } from "./AssemblyBolt"
import { resolveAssemblyModel } from "./resolve-assembly-model"

export const resolveAssemblyBoltModel = (bolt: AssemblyBolt) => {
  const props = bolt._parsedProps
  if (props.diameter === undefined) return resolveAssemblyModel(props)
  try {
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
