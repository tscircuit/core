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
    // The triangular GND remnant beneath U1 has no terminal connection.
    // Check its physical location rather than an insertion-order-dependent ID.
    const floatingIslandCenter = point(3.7, -0.3)
    expect(
      implicitPours.some((pour) => {
        if (pour.layer !== "top" || pour.shape !== "brep") return false
        return new Polygon(
          [pour.brep_shape.outer_ring, ...pour.brep_shape.inner_rings].map(
            (ring) => ring.vertices.map((vertex) => point(vertex.x, vertex.y)),
          ),
        ).contains(floatingIslandCenter)
      }),
    ).toBe(false)

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
    // Track Pipeline9's known trace-via clearance failures without allowing
    // additional violations. Normalize generated via IDs, which are not stable.
    const clearanceMessages = circuit.db.pcb_pad_pad_clearance_error
      .list()
      .map((error) =>
        error.message.replace(/pcb_via\[#pcb_via_\d+\]/g, "pcb_via"),
      )
      .sort()
    expect(clearanceMessages).toEqual([
      "Via pcb_via and pad pcb_port[.BT1 > .VBAT_N] are too close (clearance: 0mm, minimum: 0.1mm)",
      "Via pcb_via and pad pcb_port[.C1 > .pin1] are too close (clearance: 0.083mm, minimum: 0.1mm)",
      "Via pcb_via and pad pcb_port[.C1 > .pin1] are too close (clearance: 0.083mm, minimum: 0.1mm)",
      "Via pcb_via and pad pcb_port[.L2 > .pin2] are too close (clearance: 0.085mm, minimum: 0.1mm)",
    ])

    const topSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-top.test.tsx",
    )
    const bottomSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-bottom.test.tsx",
    )

    // CI can differ by 0.15% at thin copper-pour seams. Keep a small raster
    // tolerance while the geometry and clearance assertions above stay exact.
    const snapshotOptions = { diffThresholdPercent: 0.2 }
    await expect(circuit).toMatchPcbSnapshot(topSnapshotPath, {
      ...snapshotOptions,
      layer: "top",
    })
    await expect(circuit).toMatchPcbSnapshot(bottomSnapshotPath, {
      ...snapshotOptions,
      layer: "bottom",
    })
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, snapshotOptions)
  },
  { timeout: 120_000 },
)
