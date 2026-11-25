import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated silkscreen follows its footprint's pad direction on both sides", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={12} routingDisabled schematicDisabled>
      <chip
        name="TOP"
        pcbX={-4}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              portHints={["1"]}
              pcbX={0}
              pcbY={0}
              width={0.4}
              height={0.4}
              shape="rect"
            />
            <smtpad
              portHints={["2"]}
              pcbX={1}
              pcbY={1}
              width={0.4}
              height={0.4}
              shape="rect"
            />
            <silkscreentext text="TOP" pcbRotation={45} fontSize={0.7} />
          </footprint>
        }
      />
      <chip
        name="BOTTOM"
        pcbX={4}
        pcbRotation={90}
        layer="bottom"
        footprint={
          <footprint>
            <smtpad
              portHints={["1"]}
              pcbX={0}
              pcbY={0}
              width={0.4}
              height={0.4}
              shape="rect"
            />
            <smtpad
              portHints={["2"]}
              pcbX={1}
              pcbY={1}
              width={0.4}
              height={0.4}
              shape="rect"
            />
            <silkscreentext text="BOTTOM" pcbRotation={45} fontSize={0.7} />
          </footprint>
        }
      />
      <pcbnotetext
        text="Text baseline follows the two pad centers"
        pcbY={4}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  for (const text of circuit.db.pcb_silkscreen_text.list()) {
    const [start, end] = circuit.db.pcb_smtpad.list({
      pcb_component_id: text.pcb_component_id,
    })
    const dx = end!.x - start!.x
    const dy = end!.y - start!.y
    const distance = Math.hypot(dx, dy)
    const angle = (text.ccw_rotation! * Math.PI) / 180
    let glyphDirection = 1
    if (text.layer === "bottom") glyphDirection = -1
    expect(Math.cos(angle) * glyphDirection).toBeCloseTo(dx / distance, 8)
    expect(Math.sin(angle) * glyphDirection).toBeCloseTo(dy / distance, 8)
  }
})
