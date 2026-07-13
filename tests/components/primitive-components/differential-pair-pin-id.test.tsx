import { expect, it } from "bun:test"
import type { AnyCircuitElement, SourceTrace } from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Port } from "lib/components/primitive-components/Port/Port"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("registers a differential pair using source port IDs", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      {/* IDs must exist before PCB routing so the autorouter receives the pair. */}
      <differentialpair
        name="USB"
        positiveConnection="source_port_0"
        negativeConnection="source_port_2"
        maxLengthSkew={0.1}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={-2}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-4} pcbY={2} />
      <led name="LED1" footprint="0402" pcbX={6} pcbY={-2} />
      <led name="LED2" footprint="0402" pcbX={6} pcbY={2} />
      <trace name="USB_P" from=".R1 > .pin1" to=".LED1 > .anode" />
      <trace name="USB_N" from=".R2 > .pin1" to=".LED2 > .anode" />
      <pcbnotetext
        pcbX={0}
        pcbY={0}
        fontSize={1}
        text="USB differential pair selected by source port IDs"
      />
    </board>,
  )

  circuit.render()

  const selectedPositivePort: PrimitiveComponent | null =
    circuit.selectOne(".R1 > .pin1")
  if (!(selectedPositivePort instanceof Port)) {
    throw new Error("Expected to find R1 pin1")
  }
  const positiveSourcePortId: string | null =
    selectedPositivePort.source_port_id
  if (!positiveSourcePortId) {
    throw new Error("Expected R1 pin1 to have a source port ID")
  }
  expect(positiveSourcePortId).toBe("source_port_0")
  const selectedNegativePort: PrimitiveComponent | null =
    circuit.selectOne(".R2 > .pin1")
  if (!(selectedNegativePort instanceof Port)) {
    throw new Error("Expected to find R2 pin1")
  }
  const negativeSourcePortId: string | null =
    selectedNegativePort.source_port_id
  if (!negativeSourcePortId) {
    throw new Error("Expected R2 pin1 to have a source port ID")
  }
  expect(negativeSourcePortId).toBe("source_port_2")

  const subcircuitComponent: PrimitiveComponent | null = circuit.firstChild
  if (!subcircuitComponent) {
    throw new Error("Expected the circuit to contain a board")
  }

  const positiveTrace: SourceTrace | undefined = circuit.db.source_trace
    .list()
    .find((trace): boolean =>
      trace.connected_source_port_ids.includes(positiveSourcePortId),
    )
  if (!positiveTrace) {
    throw new Error(
      `Expected a source trace connected to ${positiveSourcePortId}`,
    )
  }
  const negativeTrace: SourceTrace | undefined = circuit.db.source_trace
    .list()
    .find((trace): boolean =>
      trace.connected_source_port_ids.includes(negativeSourcePortId),
    )
  if (!negativeTrace) {
    throw new Error(
      `Expected a source trace connected to ${negativeSourcePortId}`,
    )
  }

  const circuitJsonWithoutPcbTraces: AnyCircuitElement[] = circuit
    .getCircuitJson()
    .filter((element): boolean => element.type !== "pcb_trace")
  const simpleRouteJson: SimpleRouteJson = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuitJsonWithoutPcbTraces,
    subcircuitComponent,
  }).simpleRouteJson

  expect(simpleRouteJson.differentialPairs).toEqual([
    {
      connectionNames: [
        positiveTrace.source_trace_id,
        negativeTrace.source_trace_id,
      ],
      lengthTolerance: 0.1,
    },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
