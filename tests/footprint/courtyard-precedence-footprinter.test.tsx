import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import type { CapacitorProps } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { CourtyardCircle } from "lib/components/primitive-components/CourtyardCircle"
import { CourtyardOutline } from "lib/components/primitive-components/CourtyardOutline"
import { CourtyardRect } from "lib/components/primitive-components/CourtyardRect"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("components resolve courtyard overrides across footprint sources and updates", async () => {
  const footprintCircuitJson = fp
    .string("cap0402")
    .circuitJson() as AnyCircuitElement[]
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => {
          await Bun.sleep(10)
          return { footprintCircuitJson }
        },
      },
    },
  })

  circuit.add(
    <board width={14} height={9} routingDisabled>
      <capacitor
        name="C0"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={-4}
        pcbY={2}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint={
          footprintCircuitJson as Extract<
            CapacitorProps["footprint"],
            unknown[]
          >
        }
        pcbY={2}
      >
        <courtyardrect width={1.66} height={0.74} />
      </capacitor>
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="kicad:Cap0402"
        pcbX={4}
        pcbY={2}
      >
        <courtyardcircle radius={1} />
      </capacitor>
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint={
          <footprint>
            <smtpad
              portHints={["1"]}
              pcbX={-0.51}
              width={0.54}
              height={0.64}
              shape="rect"
            />
            <smtpad
              portHints={["2"]}
              pcbX={0.51}
              width={0.54}
              height={0.64}
              shape="rect"
            />
            <courtyardrect width={6} height={4} />
            <courtyardcircle radius={2} />
            <courtyardoutline
              outline={[
                { x: -3, y: -2 },
                { x: 3, y: -2 },
                { x: 3, y: 2 },
                { x: -3, y: 2 },
              ]}
            />
          </footprint>
        }
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
        footprint={<courtyardrect width={1.86} height={0.94} />}
        pcbX={3}
        pcbY={-1}
      >
        <smtpad
          portHints={["1"]}
          pcbX={-0.51}
          width={0.54}
          height={0.64}
          shape="rect"
        />
        <smtpad
          portHints={["2"]}
          pcbX={0.51}
          width={0.54}
          height={0.64}
          shape="rect"
        />
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
  await circuit.renderUntilSettled()

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

  const capacitor = circuit.selectOne(".C0")!
  const courtyardsForC0 = () =>
    circuit
      .getCircuitJson()
      .filter(
        (elm) =>
          (elm.type === "pcb_courtyard_rect" ||
            elm.type === "pcb_courtyard_circle" ||
            elm.type === "pcb_courtyard_outline") &&
          elm.pcb_component_id === capacitor.pcb_component_id,
      )
  const originalPads = structuredClone(
    circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === capacitor.pcb_component_id),
  )
  for (const [override, type] of [
    [new CourtyardRect({ width: 1.66, height: 0.74 }), "pcb_courtyard_rect"],
    [new CourtyardCircle({ radius: 1 }), "pcb_courtyard_circle"],
    [
      new CourtyardOutline({
        outline: [
          { x: -0.83, y: -0.37 },
          { x: 0.83, y: -0.37 },
          { x: 0.83, y: 0.37 },
          { x: -0.83, y: 0.37 },
        ],
      }),
      "pcb_courtyard_outline",
    ],
  ] as const) {
    capacitor.add(override)
    await circuit.renderUntilSettled()
    expect(courtyardsForC0()).toHaveLength(1)
    expect(courtyardsForC0()).toMatchObject([{ type }])
    if (override instanceof CourtyardRect) {
      const courtyardId = override.pcb_courtyard_rect_id
      override.setProps({ width: 1.7, height: 0.8 })
      await circuit.renderUntilSettled()
      expect(courtyardsForC0()).toMatchObject([{ width: 1.7, height: 0.8 }])
      expect(override.pcb_courtyard_rect_id).toBe(courtyardId)
    }
    capacitor.remove(override)
    await circuit.renderUntilSettled()
    expect(courtyardsForC0()).toHaveLength(1)
    expect(courtyardsForC0()).toMatchObject([
      { type: "pcb_courtyard_rect", width: 1.86, height: 0.94 },
    ])
  }
  expect(
    circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === capacitor.pcb_component_id),
  ).toEqual(originalPads)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)

  // Replacing a courtyard must preserve the emitted placement of packed pads,
  // including rotations and layer reflections, rather than returning to props.
  for (const layer of ["top", "bottom"] as const) {
    for (const pcbRotation of [0, 90, 180, 270]) {
      const { circuit: packedCircuit } = getTestFixture()
      packedCircuit.add(
        <board pack routingDisabled>
          <capacitor name="A" capacitance="100nF" footprint="cap0402" />
          <capacitor
            name="B"
            capacitance="100nF"
            footprint="cap0402"
            pcbRotation={pcbRotation}
            layer={layer}
          />
        </board>,
      )
      await packedCircuit.renderUntilSettled()
      const packedCapacitor = packedCircuit.selectOne(".B")!
      const defaultCourtyard = structuredClone(
        packedCircuit.db.pcb_courtyard_rect
          .list()
          .find(
            (rect) =>
              rect.pcb_component_id === packedCapacitor.pcb_component_id,
          )!,
      )
      expect(defaultCourtyard.center).not.toEqual(
        packedCapacitor._getGlobalPcbPositionBeforeLayout(),
      )
      const packedPads = structuredClone(packedCircuit.db.pcb_smtpad.list())
      const override = new CourtyardRect({ width: 1.66, height: 0.74 })
      packedCapacitor.add(override)
      await packedCircuit.renderUntilSettled()
      const overriddenCourtyard = packedCircuit.db.pcb_courtyard_rect.get(
        override.pcb_courtyard_rect_id!,
      )!
      expect(overriddenCourtyard).toMatchObject({
        center: defaultCourtyard.center,
        layer: defaultCourtyard.layer,
        width: 1.66,
        height: 0.74,
      })
      expect(overriddenCourtyard.ccw_rotation ?? 0).toBeCloseTo(
        defaultCourtyard.ccw_rotation ?? 0,
      )
      packedCapacitor.remove(override)
      await packedCircuit.renderUntilSettled()
      const restoredCourtyard = packedCircuit.db.pcb_courtyard_rect
        .list()
        .find(
          (rect) => rect.pcb_component_id === packedCapacitor.pcb_component_id,
        )!
      expect(restoredCourtyard).toMatchObject({
        center: defaultCourtyard.center,
        layer: defaultCourtyard.layer,
        width: 1.86,
        height: 0.94,
      })
      expect(restoredCourtyard.ccw_rotation ?? 0).toBeCloseTo(
        defaultCourtyard.ccw_rotation ?? 0,
      )
      expect(packedCircuit.db.pcb_smtpad.list()).toEqual(packedPads)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
