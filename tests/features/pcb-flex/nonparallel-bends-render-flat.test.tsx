import { expect, test } from "bun:test"
import { pcb_placement_error } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nonparallel bends report an error and preserve flat PCB, CAD and schematic", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      material="flex"
      thickness={0.12}
      routingDisabled
      outline={[
        { x: -20, y: -10 },
        { x: 20, y: -10 },
        { x: 20, y: -4 },
        { x: 40, y: -4 },
        { x: 40, y: 4 },
        { x: 20, y: 4 },
        { x: 20, y: 10 },
        { x: 4, y: 10 },
        { x: 4, y: 30 },
        { x: -4, y: 30 },
        { x: -4, y: 10 },
        { x: -20, y: 10 },
      ]}
    >
      <pcbbend
        x1={-4}
        y1={20}
        x2={4}
        y2={20}
        bendAngle={90}
        bendRadius={1}
        bendSide="left"
      />
      <pcbbend
        x1={30}
        y1={-4}
        x2={30}
        y2={4}
        bendAngle={90}
        bendRadius={1}
        bendSide="left"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={25} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={35} pcbY={0} />
      <silkscreentext
        text="R1"
        pcbX={0}
        pcbY={27.5}
        fontSize={1.6}
        anchorAlignment="center"
      />
      <silkscreentext
        text="R2"
        pcbX={35}
        pcbY={2.5}
        fontSize={1.6}
        anchorAlignment="center"
      />
      <pcbnotetext
        text="Unsupported folds keep flat output"
        pcbY={-8}
        fontSize={1}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain("requires parallel bends")
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
    expect(placement.is_on_folded_board).toBeUndefined()
  }
  const before = circuit.getCircuitJson()
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(before)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    // Ask the exporter to fold even though core correctly left both CAD flags
    // unset; the unsupported board fold must retain all flat geometry.
    gltf: { foldPcbs: true, boardTextureResolution: 1024 },
    diffTolerance: 0.001,
    poppygl: {
      width: 1000,
      height: 760,
      // Camera points are right-handed glTF (+Y up, mm), following
      // getBestCameraPosition's Circuit JSON -> glTF mapping (-X, Z, Y).
      camPos: [70, 65, -70],
      lookAt: [-8, 0, 7],
      up: "y+",
      fov: 35,
      backgroundColor: "#f2f3f5",
      ambient: 0.45,
      grid: undefined,
    },
  })
  expect(circuit.getCircuitJson()).toEqual(before)
})
