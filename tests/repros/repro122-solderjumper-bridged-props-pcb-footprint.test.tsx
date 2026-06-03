import { expect, test } from "bun:test"
import type { PcbSmtPad, PcbTrace, PcbTraceRoutePointWire } from "circuit-json"
import type { ReactElement } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const isRecord = (elm: unknown): elm is Record<string, unknown> =>
  typeof elm === "object" && elm !== null

const isPcbTrace = (elm: unknown): elm is PcbTrace =>
  isRecord(elm) && elm.type === "pcb_trace"

const isPcbSmtPad = (elm: unknown): elm is PcbSmtPad =>
  isRecord(elm) && elm.type === "pcb_smtpad"

const isPcbTraceWireSegment = (
  segment: PcbTrace["route"][number],
): segment is PcbTraceRoutePointWire => segment.route_type === "wire"

const getPinNumberForPcbPort = (circuitJson: unknown[], pcbPortId: string) => {
  const pcbSmtPad = circuitJson
    .filter(isPcbSmtPad)
    .find((elm) => elm.pcb_port_id === pcbPortId)
  if (!pcbSmtPad) return null

  return pcbSmtPad.port_hints?.find((hint) => /^\d+$/.test(hint)) ?? null
}

const getTracePinPair = (circuitJson: unknown[], pcbTrace: PcbTrace) => {
  const pinNumbers = new Set<string>()

  for (const segment of pcbTrace.route.filter(isPcbTraceWireSegment)) {
    if (segment.start_pcb_port_id) {
      const pinNumber = getPinNumberForPcbPort(
        circuitJson,
        segment.start_pcb_port_id,
      )
      if (pinNumber) pinNumbers.add(pinNumber)
    }

    if (segment.end_pcb_port_id) {
      const pinNumber = getPinNumberForPcbPort(
        circuitJson,
        segment.end_pcb_port_id,
      )
      if (pinNumber) pinNumbers.add(pinNumber)
    }
  }

  return Array.from(pinNumbers).sort().join("-")
}

const getPcbBridgePinPairs = async (solderJumper: ReactElement) => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {solderJumper}
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson: unknown[] = circuit.getCircuitJson()

  return circuitJson
    .filter(isPcbTrace)
    .map((pcbTrace) => getTracePinPair(circuitJson, pcbTrace))
    .filter(Boolean)
    .sort()
}

test("solderjumper bridged props resolve bridged PCB footprints", async () => {
  expect(
    await getPcbBridgePinPairs(
      <solderjumper
        name="SJ1"
        footprint="solderjumper2"
        bridgedPins={[["1", "2"]]}
      />,
    ),
  ).toEqual(["1-2"])
  expect(
    await getPcbBridgePinPairs(
      <solderjumper
        name="SJ1"
        footprint="solderjumper3"
        bridgedPins={[["2", "3"]]}
      />,
    ),
  ).toEqual(["2-3"])
})
