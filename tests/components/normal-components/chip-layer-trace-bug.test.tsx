import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const FlippedChip = ({
  name,
  ...props
}: { name: string; [key: string]: any }) => (
  <group>
    <chip {...props} name={name} layer="bottom" />
  </group>
)

test("chip with flipped layer should have traces on correct layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" autorouter="sequential-trace">
      <FlippedChip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX={-2}
              pcbY={0}
              portHints={["1"]}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX={2}
              pcbY={0}
              portHints={["2"]}
            />
          </footprint>
        }
        pcbX={0}
        pcbY={0}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <trace from=".R1 > .pin2" to=".U1 > .1" />
    </board>,
  )

  circuit.render()

  const traces = circuit.db.pcb_trace.list()

  const routeLayers = traces[0].route.flatMap((point) => {
    if ("layer" in point) {
      return [point.layer]
    }
    return [point.to_layer, point.from_layer]
  })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(routeLayers).toContain("bottom")
  expect(routeLayers).toContain("top")
})
