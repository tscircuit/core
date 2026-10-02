import { expect, test } from "bun:test"
import { pcb_placement_error } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("crossing bend regions report an error and preserve flat PCB, CAD and schematic", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      material="flex"
      outline={[
        { x: -20, y: -10 },
        { x: 20, y: -10 },
        { x: 20, y: 10 },
        { x: -20, y: 10 },
      ]}
      thickness={0.12}
      routingDisabled
    >
      <pcbbend
        x1={-20}
        y1={0}
        x2={20}
        y2={0}
        bendAngle={90}
        bendRadius={1}
        bendSide="left"
      />
      <pcbbend
        x1={0}
        y1={-10}
        x2={0}
        y2={10}
        bendAngle={90}
        bendRadius={1}
        bendSide="right"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} pcbY={5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={8} pcbY={-5} />
      <silkscreentext text="R1 flat" pcbX={-8} pcbY={7} fontSize={1.2} />
      <silkscreentext text="R2 flat" pcbX={8} pcbY={-3} fontSize={1.2} />
      <pcbnotetext
        text="Crossing regions keep flat output"
        pcbY={-8}
        fontSize={1}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain("Overlapping PCB bend zones")
  expect(errors[0].subcircuit_id).toBe(
    circuit.db.pcb_board.list()[0].subcircuit_id,
  )
  expect(pcb_placement_error.safeParse(errors[0]).success).toBe(true)
  expect(circuit.db.pcb_bend.list()).toHaveLength(2)
  expect(circuit.db.pcb_component.list()).toHaveLength(2)
  expect(circuit.db.schematic_component.list()).toHaveLength(2)
  const cad = circuit.db.cad_component.list()
  expect(cad).toHaveLength(2)
  for (const placement of cad) {
    expect(placement.position.z).toBeCloseTo(0.06)
    expect(placement.rotation?.x).toBeCloseTo(0)
    expect(placement.rotation?.y).toBeCloseTo(0)
    expect(placement.is_on_folded_board).toBeUndefined()
  }
  const before = circuit.getCircuitJson()
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(before)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showBendLines: true,
  })
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    // Exercise exporter fallback even though core leaves the CAD flags unset.
    gltf: { foldPcbs: true, boardTextureResolution: 1024, showErrors: true },
    diffTolerance: 0.001,
    poppygl: {
      width: 1000,
      height: 760,
      // Camera points: right-handed glTF (+Y up, mm), mapping (-X, Z, Y).
      camPos: [45, 38, -45],
      lookAt: [0, 0, 0],
      up: "y+",
      fov: 35,
      backgroundColor: "#f2f3f5",
      ambient: 0.45,
      debugFontSize: 20,
      debugPointColor: [160, 0, 35],
      debugLabelColor: [160, 0, 35],
      grid: undefined,
    },
  })
  expect(circuit.getCircuitJson()).toEqual(before)
})
