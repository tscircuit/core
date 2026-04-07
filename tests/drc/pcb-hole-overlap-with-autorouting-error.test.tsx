import { test, expect } from "bun:test"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test.skip("design rule check detects pad and hole overlap even after autorouting error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="80mm"
      height="60mm"
      autorouter={{
        algorithmFn: createBasicAutorouter(async () => {
          throw new Error("boom")
        }),
      }}
    >
      <capacitor
        name="C13"
        capacitance="47uF"
        footprint="1206"
        pcbX={-16.5}
        pcbY={-20.5}
        connections={{ pin1: "net.V5", pin2: "net.GND" }}
      />
      <hole name="H1" diameter="3.2mm" pcbX={-18.5} pcbY={-22.5} />

      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX={0}
        pcbY={0}
      />
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        pcbX={10}
        pcbY={0}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const autoroutingErrors = circuitJson.filter(
    (el) => el.type === "pcb_autorouting_error",
  )
  expect(autoroutingErrors).toHaveLength(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })

  const insertedOverlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_footprint_overlap_error",
  )

  expect(insertedOverlapErrors).toHaveLength(1)
})
