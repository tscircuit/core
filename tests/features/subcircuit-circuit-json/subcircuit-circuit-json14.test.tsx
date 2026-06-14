import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit-circuit-json14 - led and fiducial inflation", async () => {
  const subcircuitCircuitJson = [
    {
      type: "source_component",
      source_component_id: "source_component_led1",
      ftype: "simple_led",
      name: "LED1",
      color: "red",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_led1",
      source_component_id: "source_component_led1",
      center: { x: -2, y: 0 },
      layer: "top",
      rotation: 0,
      width: 1,
      height: 1,
    },
    {
      type: "source_component",
      source_component_id: "source_component_fid1",
      ftype: "simple_fiducial",
      name: "FID1",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_fid1",
      source_component_id: "source_component_fid1",
      center: { x: 3, y: 1 },
      layer: "top",
      rotation: 0,
      width: 0,
      height: 0,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_fid1",
      pcb_component_id: "pcb_component_fid1",
      shape: "circle",
      x: 3,
      y: 1,
      radius: 0.4,
      layer: "top",
    },
  ] as CircuitJson

  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  expect(
    circuitJson.find(
      (element) =>
        element.type === "source_component" &&
        element.ftype === "simple_led" &&
        element.name === "LED1",
    ),
  ).toBeDefined()

  const fiducialPad = circuitJson.find(
    (element) => element.type === "pcb_smtpad" && element.shape === "circle",
  )

  expect(fiducialPad).toBeDefined()
  expect(fiducialPad?.radius).toBe(0.4)
})
