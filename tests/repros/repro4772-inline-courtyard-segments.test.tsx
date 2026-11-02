import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("four inline courtyard edges retain a closed courtyard and permit autorouting", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["1"]}
              pcbX={-1}
              pcbY={0}
              width={0.6}
              height={0.4}
              shape="rect"
            />
            <smtpad
              portHints={["2"]}
              pcbX={1}
              pcbY={0}
              width={0.6}
              height={0.4}
              shape="rect"
            />
            <courtyardoutline
              outline={[
                { x: -1.5, y: 0.5 },
                { x: 1.5, y: 0.5 },
              ]}
              layer="top"
            />
            <courtyardoutline
              outline={[
                { x: 1.5, y: 0.5 },
                { x: 1.5, y: -0.5 },
              ]}
              layer="top"
            />
            <courtyardoutline
              outline={[
                { x: 1.5, y: -0.5 },
                { x: -1.5, y: -0.5 },
              ]}
              layer="top"
            />
            <courtyardoutline
              outline={[
                { x: -1.5, y: -0.5 },
                { x: -1.5, y: 0.5 },
              ]}
              layer="top"
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".U1 > .pin2" to=".R1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
  expect(
    circuit.db.pcb_courtyard_outline
      .list()
      .map((courtyard) => courtyard.outline.length),
  ).toEqual([4])
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
})
