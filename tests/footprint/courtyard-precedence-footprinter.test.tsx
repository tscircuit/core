import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit courtyards replace footprinter defaults and preserve pads", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={14} height={9} routingDisabled>
      <capacitor
        name="C0"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={-4}
        pcbY={2}
      />
      <capacitor name="C1" capacitance="100nF" footprint="cap0402" pcbY={2}>
        <courtyardrect width={1.66} height={0.74} />
      </capacitor>
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={4}
        pcbY={2}
      >
        <courtyardcircle radius={1} />
      </capacitor>
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={-3}
        pcbY={-1}
      >
        <courtyardoutline
          outline={[
            { x: -0.83, y: -0.37 },
            { x: 0.83, y: -0.37 },
            { x: 0.83, y: 0.37 },
            { x: -0.83, y: 0.37 },
          ]}
        />
      </capacitor>
      <capacitor
        name="C4"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={3}
        pcbY={-1}
      >
        <courtyardrect width={1.66} height={0.74} />
        <courtyardcircle radius={1} layer="bottom" />
      </capacitor>
      <pcbnotetext
        pcbY={3.7}
        text="C0: default   C1: rect   C2: circle"
        fontSize={0.5}
      />
      <pcbnotetext
        pcbY={-3}
        text="C3: outline   C4: rect + circle"
        fontSize={0.5}
      />
    </board>,
  )
  circuit.render()

  const rects = circuit.db.pcb_courtyard_rect.list()
  expect(rects).toHaveLength(3)
  expect(
    rects.find(
      (rect) =>
        rect.pcb_component_id === circuit.selectOne(".C0")!.pcb_component_id,
    ),
  ).toMatchObject({ width: 1.86, height: 0.94 })
  expect(
    rects.filter(
      (rect) =>
        rect.pcb_component_id === circuit.selectOne(".C1")!.pcb_component_id,
    ),
  ).toMatchObject([{ width: 1.66, height: 0.74 }])
  expect(circuit.db.pcb_courtyard_circle.list()).toHaveLength(2)
  expect(
    circuit.db.pcb_courtyard_circle
      .list()
      .find(
        (circle) =>
          circle.pcb_component_id ===
          circuit.selectOne(".C4")!.pcb_component_id,
      ),
  ).toMatchObject({ layer: "bottom", radius: 1 })
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(1)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(10)

  for (const capacitor of circuit.selectAll("capacitor")) {
    const pcbComponent = circuit.db.pcb_component.get(
      capacitor.pcb_component_id!,
    )!
    const pads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "rect")
      .filter((pad) => pad.pcb_component_id === capacitor.pcb_component_id)
    expect(pads).toHaveLength(2)
    for (const pad of pads) {
      expect(pad).toMatchObject({ shape: "rect", width: 0.54, height: 0.64 })
      expect(Math.abs(pad.x - pcbComponent.center.x)).toBeCloseTo(0.51)
      expect(pad.y - pcbComponent.center.y).toBeCloseTo(0)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
