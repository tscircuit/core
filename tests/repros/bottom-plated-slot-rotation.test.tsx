import { beforeAll, expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { loadCadComponentMesh } from "circuit-json-to-gltf"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"
import { createPcbWithTopBottom3dSnapshot } from "tests/fixtures/create-pcb-with-top-bottom-3d-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"

const { circuit, staticAssetsServerUrl } = getTestFixture({
  withStaticAssetsServer: true,
})

beforeAll(async () => {
  // This fixture was regenerated with easyeda@0.0.389 and the OBJ metadata,
  // including the native model bounds and origin fixed by easyeda-converter#540.
  // Only the OBJ URL changes to the checked-in copy, avoiding a network dependency.
  const partCircuitJson = (usbCC165948CircuitJson as AnyCircuitElement[]).map(
    (element) =>
      element.type === "cad_component"
        ? {
            ...element,
            model_obj_url: `${staticAssetsServerUrl}/models/C165948.obj`,
          }
        : element,
  )

  circuit.add(
    <board
      width={30}
      height={18}
      routingDisabled
      schematicDisabled
      partsEngine={{
        findPart: async () => ({ jlcpcb: ["C165948"] }),
        fetchPartCircuitJson: async () => partCircuitJson,
      }}
    >
      <pcbnotetext
        text="USB-C C165948: pill mounting holes, both ports at 30deg"
        pcbY={7.5}
        fontSize={0.6}
        color="white"
      />
      <pcbnotetext
        text="USB_TOP: TOP"
        pcbX={-7}
        pcbY={-6.5}
        fontSize={0.6}
        color="white"
      />
      <connector
        name="USB_TOP"
        standard="usb_c"
        layer="top"
        pcbX={-7}
        pcbRotation={30}
      />
      <pcbnotetext
        text="USB_BOTTOM: BOTTOM"
        pcbX={7}
        pcbY={-6.5}
        fontSize={0.6}
        color="white"
      />
      <connector
        name="USB_BOTTOM"
        standard="usb_c"
        layer="bottom"
        pcbX={7}
        pcbRotation={30}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Keep snapshot failures outside test.failing so they still fail CI.
  const snapshot = await createPcbWithTopBottom3dSnapshot(
    circuit.getCircuitJson(),
  )
  await expect(snapshot).toMatchSvgSnapshot(import.meta.path)
}, 60_000)

test("USB-C slots align with model tabs on both faces", async () => {
  for (const name of ["USB_TOP", "USB_BOTTOM"]) {
    const connector = circuit.selectOne(`.${name}`)!
    const holes = circuit.db.pcb_plated_hole
      .list()
      .filter((hole) => hole.pcb_component_id === connector.pcb_component_id)
    expect(holes).toHaveLength(4)
    const firstShell = holes.find((hole) =>
      hole.port_hints?.includes("SHELL1"),
    )!
    const secondShell = holes.find((hole) =>
      hole.port_hints?.includes("SHELL2"),
    )!

    // C165948's first two shell slots share a footprint-local X and run along
    // Y. Their emitted centers give the connector's long-slot direction in
    // board-world mm (+X right, +Y up). Translation cancels for this direction.
    const axisDegrees =
      (Math.atan2(secondShell.y - firstShell.y, secondShell.x - firstShell.x) *
        180) /
      Math.PI
    const expectedAxis = ((axisDegrees % 180) + 180) % 180

    const cad = circuit.db.cad_component
      .list()
      .find((cad) => cad.pcb_component_id === connector.pcb_component_id)!
    const pcbComponent = circuit.db.pcb_component.get(
      connector.pcb_component_id!,
    )!
    const mesh = await loadCadComponentMesh(cad, { pcbComponent })
    // Actual renderer mesh points in right-handed board-world mm (+X right,
    // +Y up the PCB, +Z above). The deepest mounting-tab tips are nearest the
    // opposite PCB face: minimum Z for a top port, maximum Z for a bottom port.
    const modelVertices = Array.from(
      { length: mesh.positions.length / 3 },
      (_, vertexIndex) => ({
        x: mesh.positions[vertexIndex * 3]!,
        y: mesh.positions[vertexIndex * 3 + 1]!,
        z: mesh.positions[vertexIndex * 3 + 2]!,
      }),
    )
    const tipZ =
      pcbComponent.layer === "top"
        ? Math.min(...modelVertices.map((vertex) => vertex.z))
        : Math.max(...modelVertices.map((vertex) => vertex.z))
    const tabTips = modelVertices.filter(
      (vertex) => Math.abs(vertex.z - tipZ) < 1e-6,
    )
    const unmatchedTabTips = new Set(tabTips)

    for (const hole of holes) {
      if (hole.shape !== "pill") {
        throw new Error("Expected the USB-C pill-shaped mounting slot")
      }
      // The imported slots are taller than they are wide,
      // so their long axis starts at 90 degrees before placement rotation.
      expect(((hole.ccw_rotation ?? 0) + 90) % 180).toBeCloseTo(expectedAxis, 6)

      // Transform mesh points into the emitted slot's local frame. A pill is
      // the set of points within hole_width/2 of its vertical center segment.
      const worldToSlot = compose(
        rotate((-(hole.ccw_rotation ?? 0) * Math.PI) / 180),
        translate(-hole.x, -hole.y),
      )
      const radius = hole.hole_width / 2
      const halfSegmentLength = (hole.hole_height - hole.hole_width) / 2
      let containedTipCount = 0
      for (const tip of tabTips) {
        const localTip = applyToPoint(worldToSlot, tip)
        const distanceToSegment = Math.hypot(
          localTip.x,
          Math.max(0, Math.abs(localTip.y) - halfSegmentLength),
        )
        if (distanceToSegment <= radius + 0.01) {
          containedTipCount += 1
          unmatchedTabTips.delete(tip)
        }
      }
      expect(containedTipCount).toBeGreaterThan(0)
    }
    expect(unmatchedTabTips.size).toBe(0)
  }
})
