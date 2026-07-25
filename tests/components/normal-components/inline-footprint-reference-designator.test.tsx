import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const inlineFootprint = (
  <footprint>
    <smtpad
      pcbX={-0.5}
      pcbY={0}
      width="0.55mm"
      height="1.1mm"
      shape="rect"
      portHints={["pin1"]}
    />
    <smtpad
      pcbX={0.5}
      pcbY={0}
      width="0.55mm"
      height="1.1mm"
      shape="rect"
      portHints={["pin2"]}
    />
  </footprint>
)

const render = async (element: any) => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      {element}
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}

test("an inline footprint gets a silkscreen reference designator", async () => {
  const circuit = await render(<chip name="J1" footprint={inlineFootprint} />)

  const texts = circuit.db.pcb_silkscreen_text.list()
  expect(texts.map((t) => t.text)).toContain("J1")
})

test("a string footprint keeps exactly one reference designator", async () => {
  // The fix must not add a duplicate on the path that already worked.
  const circuit = await render(<chip name="U1" footprint="soic8" />)

  const named = circuit.db.pcb_silkscreen_text
    .list()
    .filter((t) => t.text === "U1")
  expect(named.length).toBe(1)
})

test("the inline designator is attached to its component and layer", async () => {
  const circuit = await render(<chip name="J1" footprint={inlineFootprint} />)

  const text = circuit.db.pcb_silkscreen_text
    .list()
    .find((t) => t.text === "J1")!
  const pcbComponent = circuit.db.pcb_component.list()[0]!

  expect(text.pcb_component_id).toBe(pcbComponent.pcb_component_id)
  expect(text.layer).toBe("top")
})

test("the inline designator sits above the footprint, not on top of the pads", async () => {
  const circuit = await render(<chip name="J1" footprint={inlineFootprint} />)

  const text = circuit.db.pcb_silkscreen_text
    .list()
    .find((t) => t.text === "J1")!
  const padTop = Math.max(
    ...circuit.db.pcb_smtpad
      .list()
      .map((pad: any) => pad.y + (pad.height ?? 0) / 2),
  )

  expect(text.anchor_position.y).toBeGreaterThan(padTop)
  expect(Number.isFinite(text.font_size)).toBe(true)
  expect(text.font_size).toBeGreaterThan(0)
})

test("a bottom-layer inline footprint puts its designator on the bottom", async () => {
  const circuit = await render(
    <chip name="J1" layer="bottom" footprint={inlineFootprint} />,
  )

  const text = circuit.db.pcb_silkscreen_text
    .list()
    .find((t) => t.text === "J1")!
  expect(text.layer).toBe("bottom")
})

test("a footprint that already names the component is not duplicated", async () => {
  const circuit = await render(
    <chip
      name="J1"
      footprint={
        <footprint>
          <smtpad
            pcbX={0}
            pcbY={0}
            width="0.55mm"
            height="1.1mm"
            shape="rect"
            portHints={["pin1"]}
          />
          <silkscreentext text="J1" pcbX={0} pcbY={2} />
        </footprint>
      }
    />,
  )

  const named = circuit.db.pcb_silkscreen_text
    .list()
    .filter((t) => t.text === "J1")
  expect(named.length).toBe(1)
})
