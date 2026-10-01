import type { ParsedPinAttributeMap } from "@tscircuit/props"

const firmwareAttributes = [
  "isInput",
  "isOutput",
  "isGpio",
  "initialOutputState",
  "interruptTrigger",
  "i2cMaxBitRate",
  "doNotConfigure",
  "isUsingInternalPullup",
  "isUsingInternalPulldown",
  "isUsingOpenDrain",
  "isUsingPushPull",
] as const satisfies readonly (keyof ParsedPinAttributeMap)[]

/** Alias order must not silently replace explicitly declared firmware choices. */
export function validatePinAttributeAliases({
  pinAttributes,
  portName,
}: {
  pinAttributes: ParsedPinAttributeMap[]
  portName: string
}): void {
  for (const attribute of firmwareAttributes) {
    const declared = pinAttributes
      .map((attributes) => attributes[attribute])
      .filter((setting) => setting !== undefined)
    if (new Set(declared).size > 1) {
      throw new Error(
        `Conflicting pinAttributes.${attribute} declarations for ${portName}`,
      )
    }
  }
}
