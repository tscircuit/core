import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("trace pcbPath supports selectors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={["R1.pin2", { x: 0, y: 4 }, "R2.pin1"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-selectors`)
})

test("trace pcbPath selectors can set thickness", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={["R1.pin2", { x: 0, y: 4 }, "R2.pin1"]}
        thickness="0.5mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace).toBeDefined()
  if (!pcbTrace) throw new Error("Expected trace to be routed")
  expect(
    pcbTrace.route
      .filter((segment) => segment.route_type === "wire")
      .every((segment) => segment.width === 0.5),
  ).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(
    `${import.meta.path}-selectors-thickness`,
  )
})

test("trace pcbPath selectors with thickness works with KiCad footprints", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: external0402Footprint,
        }),
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="kicad:Resistor_SMD/R_0402_1005Metric"
        pcbX={-3}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="kicad:Resistor_SMD/R_0402_1005Metric"
        pcbX={3}
        pcbY={0}
      />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={["R1.pin2", { x: 0, y: 4 }, "R2.pin1"]}
        thickness="0.5mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace).toBeDefined()
  if (!pcbTrace) throw new Error("Expected trace to be routed")
  expect(
    pcbTrace.route
      .filter((segment) => segment.route_type === "wire")
      .every((segment) => segment.width === 0.5),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(
    `${import.meta.path}-selectors-thickness-kicad`,
  )
})
