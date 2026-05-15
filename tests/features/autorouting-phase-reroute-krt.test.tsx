import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"
import { createKiCadRoutingToolsAutorouter } from "@tscircuit/krt-wasm"

const subcircuitCircuitJson = await renderToCircuitJson(
  <board>
    <resistor resistance="1k" footprint="0402" name="R1" pcbX={-5} pcbY={0} />
    <capacitor
      capacitance="1000pF"
      footprint="0402"
      name="C1"
      pcbX={5}
      pcbY={0}
    />
    <trace from="R1.pin1" to="C1.pin1" />
  </board>,
)

test("autoroutingphase reroutes a subcircuit using krt-wasm", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm">
      <subcircuit circuitJson={subcircuitCircuitJson} />

      <autoroutingphase
        reroute
        region={{
          shape: "rect",
          minX: -1,
          maxX: 1,
          minY: -1,
          maxY: 1,
        }}
        autorouter={{
          algorithmFn: createKiCadRoutingToolsAutorouter({
            gridStep: 0.1,
            clearance: 0.2,
            maxIterations: 300_000,
          }),
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
