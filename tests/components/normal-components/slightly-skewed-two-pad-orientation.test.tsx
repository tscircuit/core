import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("infers pin 1 orientation for a slightly skewed two-pad footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={8} height={6} routingDisabled>
      <led
        name="LED1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-0.799465}
              pcbY={-0.003429}
              width={0.8}
              height={0.8}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0.799465}
              pcbY={0.003429}
              width={0.8}
              height={0.8}
              shape="rect"
            />
          </footprint>
        }
      />
      <silkscreentext
        text="Pin 1 left"
        pcbY={-1.5}
        fontSize={0.5}
        anchorAlignment="center"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_component.list()[0]?.pin1_location).toBe("topside_left")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
