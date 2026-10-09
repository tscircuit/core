import { expect, test } from "bun:test"
import { CourtyardTestFootprint } from "tests/fixtures/courtyard-test-footprint"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit courtyards replace JSX footprint courtyards", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={22} height={14} routingDisabled>
      <capacitor
        name="C0"
        capacitance="100nF"
        pcbX={-6}
        pcbY={3}
        footprint={<CourtyardTestFootprint />}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        pcbY={3}
        footprint={<CourtyardTestFootprint />}
      >
        <courtyardrect width={1.66} height={0.74} />
      </capacitor>
      <capacitor
        name="C2"
        capacitance="100nF"
        pcbX={6}
        pcbY={3}
        footprint={<CourtyardTestFootprint />}
      >
        <courtyardcircle radius={1} />
      </capacitor>
      <capacitor name="C3" capacitance="100nF" pcbX={-3} pcbY={-3}>
        <CourtyardTestFootprint />
        <courtyardoutline
          outline={[
            { x: -0.83, y: -0.37 },
            { x: 0.83, y: -0.37 },
            { x: 0.83, y: 0.37 },
            { x: -0.83, y: 0.37 },
          ]}
        />
      </capacitor>
      {/* A React footprint may itself be a primitive, without a Footprint wrapper. */}
      <capacitor
        name="C4"
        capacitance="100nF"
        pcbX={3}
        pcbY={-3}
        footprint={<courtyardrect width={6} height={4} />}
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
        <courtyardcircle radius={1} />
      </capacitor>
      <pcbnotetext
        pcbY={6}
        text="C0: defaults   C1: rect   C2: circle"
        fontSize={0.6}
      />
      <pcbnotetext
        pcbY={-6}
        text="C3: nested footprint   C4: primitive footprint"
        fontSize={0.6}
      />
    </board>,
  )
  circuit.render()

  expect(circuit.db.pcb_courtyard_rect.list()).toHaveLength(2)
  expect(circuit.db.pcb_courtyard_circle.list()).toHaveLength(3)
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(2)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(10)
  const defaultPartId = circuit.selectOne(".C0")!.pcb_component_id
  expect(
    circuit.db.pcb_courtyard_rect
      .list()
      .filter((rect) => rect.pcb_component_id !== defaultPartId),
  ).toMatchObject([{ width: 1.66, height: 0.74 }])
  expect(
    circuit.db.pcb_courtyard_circle
      .list()
      .filter((circle) => circle.pcb_component_id !== defaultPartId)
      .every((circle) => circle.radius === 1),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
