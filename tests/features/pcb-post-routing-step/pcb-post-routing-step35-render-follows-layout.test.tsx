import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("render output lands on its component after a pack layout has moved it", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board pcbPack pcbGap="1mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1}
              height={1}
              portHints={["1"]}
              pcbX={0}
              pcbY={0}
              layer="top"
            />
            <pcbpostroutingstep
              render={() => (
                <silkscreentext text="TP" pcbX={0} pcbY={1} fontSize={0.4} />
              )}
            />
          </footprint>
        }
        connections={{ pin1: "R1.pin1" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const cj = circuit.getCircuitJson()
  const u1 = cj.find(
    (e) =>
      e.type === "pcb_component" &&
      (
        cj.find(
          (s: any) => s.type === "source_component" && s.name === "U1",
        ) as any
      ).source_component_id === (e as any).source_component_id,
  ) as any
  const label = cj.find(
    (e) => e.type === "pcb_silkscreen_text" && (e as any).text === "TP",
  ) as any
  // the pack layout moved U1 away from the origin it was planned at
  expect(Math.hypot(u1.center.x, u1.center.y)).toBeGreaterThan(0.1)
  expect(label.anchor_position.x).toBeCloseTo(u1.center.x, 6)
  expect(label.anchor_position.y).toBeCloseTo(u1.center.y + 1, 6)
})
