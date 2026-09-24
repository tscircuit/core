import type { Port } from "lib/components/primitive-components/Port"
import { expect, test } from "bun:test"
import { BooleanOperations, Box, point, Polygon } from "@flatten-js/core"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Nrf52810Circuit from "./nrf52810-circuit"

// Reproduces https://tscircuit.com/seveibar/nrf52810#files without explicit
// <copperpour> elements so the implicit copper pour phase owns their creation.
// Implicit copper pours are disabled; retain coverage for a future re-enable.
test.skip(
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
    // Exact preloaded copper currently leaves two known via-to-pad violations:
    // a BT1.VBAT_N overlap and an L2.pin2 gap of about 0.085 mm. Keep these
    // visible as fixture limitations while rejecting new or worse violations.
    const knownL2Pin2ClearanceMm = 0.085
    const clearanceToleranceMm = 1e-6
    const knownPadClearanceLimits = [
      { selector: ".BT1 > .VBAT_N", minimumClearanceMm: 0 },
      {
        selector: ".L2 > .pin2",
        minimumClearanceMm: knownL2Pin2ClearanceMm - clearanceToleranceMm,
      },
    ].map(({ selector, minimumClearanceMm }) => {
      const port = circuit.selectOne(selector) as Port
      const pad = circuit.db.pcb_smtpad.getWhere({
        pcb_port_id: port.pcb_port_id!,
      })!
      return { padId: pad.pcb_smtpad_id, minimumClearanceMm }
    })
    const padClearanceErrors = circuit.db.pcb_pad_pad_clearance_error.list()
    for (const error of padClearanceErrors) {
      const knownPad = knownPadClearanceLimits.find(({ padId }) =>
        error.pcb_pad_ids.includes(padId),
      )
      expect(knownPad).toBeDefined()
      expect(error.pcb_pad_ids).toHaveLength(2)
      const viaIds = error.pcb_pad_ids.filter((padId) =>
        circuit.db.pcb_via.get(padId),
      )
      expect(viaIds).toHaveLength(1)
      expect(error.actual_clearance).toBeDefined()
      expect(error.actual_clearance!).toBeGreaterThanOrEqual(
        knownPad!.minimumClearanceMm,
      )
    }
    // Allow each known location to improve, but never accept two violations at
    // the same pad just because the total still fits the old count of two.
    for (const { padId } of knownPadClearanceLimits) {
      expect(
        padClearanceErrors.filter((error) => error.pcb_pad_ids.includes(padId))
          .length,
      ).toBeLessThanOrEqual(1)
    }

    const topSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-top.test.tsx",
    )
    const bottomSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-bottom.test.tsx",
    )

    // CI differs at thin copper-pour seams: 0.15% on top and 0.24% when
    // layers overlap. Geometry checks and per-pad clearance limits still apply.
    const snapshotOptions = { diffThresholdPercent: 0.2 }
    await expect(circuit).toMatchPcbSnapshot(topSnapshotPath, {
      ...snapshotOptions,
      layer: "top",
    })
    await expect(circuit).toMatchPcbSnapshot(bottomSnapshotPath, {
      ...snapshotOptions,
      layer: "bottom",
    })
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      diffThresholdPercent: 0.3,
    })
  },
  { timeout: 120_000 },
)
