import { expect, test } from "bun:test"
import { BooleanOperations, Box, point, Polygon } from "@flatten-js/core"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Nrf52810Circuit from "./nrf52810-circuit"

// Reproduces https://tscircuit.com/seveibar/nrf52810#files without explicit
// <copperpour> elements so the implicit copper pour phase owns their creation.
test(
  "nRF52810 tracker routes with implicit copper pours",
  async () => {
    const { circuit } = getTestFixture({
      platform: { placementDrcChecksDisabled: true },
    })

    circuit.add(<Nrf52810Circuit />)
    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(60)
    const implicitPours = circuit.db.pcb_copper_pour.list()
    expect(implicitPours.length).toBeGreaterThan(0)
    expect(implicitPours.every((pour) => pour.shape === "brep")).toBe(true)

    const sourceNets = circuit.db.source_net.list()
    const gndNet = sourceNets.find((net) => net.name === "GND")
    const vbatNet = sourceNets.find((net) => net.name === "VBAT")
    if (!gndNet || !vbatNet) throw new Error("Expected GND and VBAT nets")

    const isCoveredByNet = (
      samplePoint: { x: number; y: number },
      sourceNetId: string,
    ) =>
      implicitPours.some((pour) => {
        if (
          pour.shape !== "brep" ||
          pour.layer !== "top" ||
          pour.source_net_id !== sourceNetId
        ) {
          return false
        }
        const polygon = new Polygon(
          [pour.brep_shape.outer_ring, ...pour.brep_shape.inner_rings].map(
            (ring) => ring.vertices.map((vertex) => point(vertex.x, vertex.y)),
          ),
        ).reverse()
        return polygon.contains(point(samplePoint.x, samplePoint.y))
      })

    // The exact SWDCLK/connectivity_net524 clearance cuts this small area off
    // from GND. It must be removed while the neighboring VBAT region remains.
    expect(isCoveredByNet({ x: 3.65, y: -0.25 }, gndNet.source_net_id)).toBe(
      false,
    )
    expect(isCoveredByNet({ x: 1.85, y: -2.35 }, vbatNet.source_net_id)).toBe(
      true,
    )

    const rfKeepout = circuit.db.pcb_keepout
      .list()
      .find((keepout) => keepout.shape === "rect")
    if (!rfKeepout || rfKeepout.shape !== "rect") {
      throw new Error("Expected the rectangular RF keepout")
    }
    expect(rfKeepout.layers).toEqual(["top", "bottom"])

    // Compare emitted geometry in board-world XY (right/up, mm), viewed from
    // above the PCB. The hatch overlay alone can hide accidental copper fill.
    const keepoutPolygon = new Polygon(
      new Box(
        rfKeepout.center.x - rfKeepout.width / 2,
        rfKeepout.center.y - rfKeepout.height / 2,
        rfKeepout.center.x + rfKeepout.width / 2,
        rfKeepout.center.y + rfKeepout.height / 2,
      ),
    )
    for (const layer of rfKeepout.layers) {
      const layerPours = implicitPours.filter((pour) => pour.layer === layer)
      expect(layerPours.length).toBeGreaterThan(0)
      let keepoutOverlapArea = 0
      for (const pour of layerPours) {
        if (pour.shape !== "brep") {
          throw new Error("Expected final BRep copper pour geometry")
        }
        const pourPolygon = new Polygon(
          [pour.brep_shape.outer_ring, ...pour.brep_shape.inner_rings].map(
            (ring) => ring.vertices.map((vertex) => point(vertex.x, vertex.y)),
          ),
        ).reverse() // Circuit JSON outer rings are CW; Flatten expects CCW.
        keepoutOverlapArea += BooleanOperations.intersect(
          pourPolygon,
          keepoutPolygon,
        ).area()
      }
      expect(keepoutOverlapArea).toBeCloseTo(0, 8)
    }

    const traceErrors = circuit.db.pcb_trace_error.list()
    const hasGndVbatContact = traceErrors.some(
      (error) =>
        error.message.includes(".U1 > port.pin45, .X1 > port.pin2") &&
        error.message.includes(".U1 > port.pin13, .U1 > port.pin48"),
    )
    expect(hasGndVbatContact).toBe(false)
    expect(circuit.db.pcb_pad_pad_clearance_error.list()).toHaveLength(0)

    const topSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-top.test.tsx",
    )
    const bottomSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-bottom.test.tsx",
    )

    await expect(circuit).toMatchPcbSnapshot(topSnapshotPath, { layer: "top" })
    await expect(circuit).toMatchPcbSnapshot(bottomSnapshotPath, {
      layer: "bottom",
    })
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 120_000 },
)
