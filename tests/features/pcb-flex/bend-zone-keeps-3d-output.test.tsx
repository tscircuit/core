import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bend-zone CAD and stiffener stay flat while valid CAD and the board fold", async () => {
  const { circuit } = getTestFixture()
  const bendZoneRoute = [
    { route_type: "wire", x: -5, y: 0, width: 0.1, layer: "top" },
    { route_type: "wire", x: 0, y: 0, width: 0.1, layer: "top" },
    { route_type: "wire", x: 0, y: 3, width: 0.1, layer: "top" },
  ] satisfies PcbTraceRoutePoint[]
  circuit.add(
    <board
      material="flex"
      width={40}
      height={20}
      thickness={0.12}
      routingDisabled
    >
      <pcbbend
        x1={0}
        y1={-10}
        x2={0}
        y2={10}
        bendAngle={90}
        bendRadius={1}
        bendSide="left"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbY={-4} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={-8} />
      <via pcbX={0} pcbY={4} holeDiameter={0.2} outerDiameter={0.5} />
      <pcbtrace route={bendZoneRoute} />
      <pcbstiffener
        shape="rect"
        pcbX={0}
        pcbY={-7}
        width={2}
        height={2}
        layer="bottom"
        material="polyimide"
        thickness={0.2}
      />
      <silkscreentext
        text="R1 flat"
        pcbX={4}
        pcbY={-4}
        fontSize={1.2}
        anchorAlignment="center"
      />
      <silkscreentext
        text="R3 folded"
        pcbX={-8}
        pcbY={2}
        fontSize={1.2}
        anchorAlignment="center"
      />
      <silkscreentext
        text="Stiffener flat"
        pcbX={5}
        pcbY={-7}
        fontSize={1.2}
        anchorAlignment="center"
      />
      <silkscreentext
        text="Stiffener flat"
        pcbX={7}
        pcbY={-7}
        layer="bottom"
        fontSize={1.2}
        anchorAlignment="center"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const [flatCad, foldedCad] = circuit.db.cad_component.list()
  expect(flatCad.position).toEqual({ x: 0, y: -4, z: 0.06 })
  expect(flatCad.is_on_folded_board).toBeUndefined()
  expect(foldedCad.is_on_folded_board).toBe(true)
  expect(foldedCad.position.z).toBeGreaterThan(6)
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain("CAD mount intersects PCB bend zone")
  expect(circuit.db.pcb_trace.list()[0].route).toEqual(bendZoneRoute)
  const before = circuit.getCircuitJson()
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(before)
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    // The exporter infers folding from valid R3's emitted CAD fold flag, while
    // retaining the invalid R1 mount and bend-zone stiffener at their flat pose.
    gltf: { boardTextureResolution: 1024, showErrors: true },
    diffTolerance: 0.001,
    poppygl: {
      width: 1000,
      height: 760,
      // Camera points are right-handed glTF (+Y up, mm), following
      // getBestCameraPosition's Circuit JSON -> glTF mapping (-X, Z, Y).
      camPos: [-50, 42, -48],
      lookAt: [0, 7, 0],
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
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    // View the underside directly so dropping or folding the stiffener changes
    // the snapshot rather than hiding behind the board in the CAD view above.
    gltf: { boardTextureResolution: 1024 },
    snapshotSuffix: "bottom",
    diffTolerance: 0.001,
    poppygl: {
      width: 1000,
      height: 760,
      camPos: [-22, -22, -32],
      lookAt: [-5, 0, -7],
      up: "y+",
      fov: 35,
      backgroundColor: "#f2f3f5",
      ambient: 0.45,
      grid: undefined,
    },
  })
  expect(circuit.getCircuitJson()).toEqual(before)
})
