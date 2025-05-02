import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
test("Double schematic traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="25mm"
      height="30mm"
      autorouter={{
        serverCacheEnabled: false,
      }}
      schTraceAutoLabelEnabled
    >
      <resistor
        name="R1"
        resistance="10k"
        footprint="1206"
        schX={-2}
        schY={4}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="1206"
        schX={-2}
        schY={3}
      />
      <resistor name="R3" resistance="10k" footprint="1206" schX={0} schY={0} />
      <resistor name="R4" resistance="10k" footprint="1206" schX={2} schY={1} />
      <resistor
        name="R5"
        resistance="10k"
        footprint="1206"
        schX={-2}
        schY={1}
      />
      <trace from=".R4 > .pin1" to=".R5 > .pin2" />
      <trace from=".R2 > .pin2" to=".R3 > .pin2" />
      <trace from=".R1 > .pin1" to=".R3 > .pin2" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
