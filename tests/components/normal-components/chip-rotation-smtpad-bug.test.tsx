import { test, expect } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip rotation should properly adjust SMT pad positions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="3mm"
              height="1mm"
              pcbX={-2}
              pcbY={0}
              portHints={["1"]}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const [pad] = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]

  expect(pad.width).toBe(1)
  expect(pad.height).toBe(3)
})
