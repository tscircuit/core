import type { AnyCircuitElement } from "circuit-json"

const PIN_NUMBER_HINT_PATTERN = /^(?:pin)?(\d+)$/i

const getPinNumberFromHints = (
  portHints: string[] | undefined,
): number | undefined => {
  for (const portHint of portHints ?? []) {
    const match = portHint.trim().match(PIN_NUMBER_HINT_PATTERN)
    if (match) return Number.parseInt(match[1], 10)
  }
}

const isElectricalJstPin = (
  pinNumber: number | undefined,
  pinCount: number,
): pinNumber is number =>
  pinNumber !== undefined && pinNumber >= 1 && pinNumber <= pinCount

/**
 * Keep the fetched JST footprint and CAD data while replacing vendor-specific
 * electrical pin aliases with stable pin1..pinN names. Fetched schematic
 * primitives are omitted so the connector's generated box remains consistent
 * across interchangeable parts.
 */
export const convertCircuitJsonToJstStandardCircuitJson = (
  partCircuitJson: AnyCircuitElement[],
  pinCount: number,
): AnyCircuitElement[] => {
  const pinNumberBySourcePortId = new Map<string, number>()
  for (const element of partCircuitJson) {
    if (
      element.type === "source_port" &&
      typeof element.pin_number === "number"
    ) {
      pinNumberBySourcePortId.set(element.source_port_id, element.pin_number)
    }
  }

  const pinNumberByPcbPortId = new Map<string, number>()
  for (const element of partCircuitJson) {
    if (element.type !== "pcb_port") continue
    const pinNumber = pinNumberBySourcePortId.get(element.source_port_id)
    if (pinNumber !== undefined) {
      pinNumberByPcbPortId.set(element.pcb_port_id, pinNumber)
    }
  }

  return partCircuitJson
    .filter((element) => !element.type.startsWith("schematic_"))
    .map((element) => {
      if (element.type === "source_port") {
        const pinNumber = element.pin_number
        return {
          ...element,
          name:
            typeof pinNumber === "number" ? `pin${pinNumber}` : element.name,
          port_hints: isElectricalJstPin(pinNumber, pinCount)
            ? [`pin${pinNumber}`]
            : [],
        }
      }

      if (!("port_hints" in element) && !("pcb_port_id" in element)) {
        return element
      }

      const pinNumberFromHints =
        "port_hints" in element
          ? getPinNumberFromHints(element.port_hints)
          : undefined
      const pinNumberFromPcbPort =
        "pcb_port_id" in element && typeof element.pcb_port_id === "string"
          ? pinNumberByPcbPortId.get(element.pcb_port_id)
          : undefined
      const pinNumber = pinNumberFromHints ?? pinNumberFromPcbPort

      return {
        ...element,
        port_hints: isElectricalJstPin(pinNumber, pinCount)
          ? [`pin${pinNumber}`]
          : [],
      } as AnyCircuitElement
    })
}
