import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { CapacityMeshAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"

test("interconnect test", async () => {
  const { circuit } = getTestFixture()

  let autorouterFinished = false

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: async (simpleRouteJson) => {
          const autorouter = new CapacityMeshAutorouter(simpleRouteJson, {
            useAssignableViaSolver: true,
          })
          autorouter.on("complete", () => {
            autorouterFinished = true
          })
          return autorouter
        },
      }}
    >
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={"1k"}
        footprint="0402"
      />
      <interconnect pcbX={0} pcbY={0} name="interconnect" footprint="0805" />
      <resistor name="R2" resistance="1k" pcbX={5} pcbY={0} footprint="0402" />

      <trace from="R1.pin1" to="R2.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
