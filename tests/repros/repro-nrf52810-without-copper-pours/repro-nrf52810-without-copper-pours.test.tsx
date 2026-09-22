import { expect, test } from "bun:test"
import { BooleanOperations, Box, point, Polygon } from "@flatten-js/core"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
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
    // The old triangular island beneath U1 may become part of connected
    // ground copper when routing changes. Follow touching pour polygons and
    // require a physical connection to a same-net via, rather than forbidding
    // all copper at this location.
    const connMap = getFullConnectivityMapFromCircuitJson(
      circuit.getCircuitJson(),
    )
    const topPourPolygons = implicitPours.flatMap((pour) => {
      if (pour.layer !== "top" || pour.shape !== "brep") return []
      return [
        {
          pour,
          polygon: new Polygon(
            [pour.brep_shape.outer_ring, ...pour.brep_shape.inner_rings].map(
              (ring) =>
                ring.vertices.map((vertex) => point(vertex.x, vertex.y)),
            ),
          ),
        },
      ]
    })
    for (const candidate of topPourPolygons.filter(({ polygon }) =>
      polygon.contains(point(3.7, -0.3)),
    )) {
      const sourceNetId = candidate.pour.source_net_id
      if (!sourceNetId) throw new Error("Expected an implicit pour net")
      const connectedPours = new Set([candidate])
      for (const current of connectedPours) {
        for (const other of topPourPolygons) {
          if (
            other.pour.source_net_id === sourceNetId &&
            current.polygon.distanceTo(other.polygon)[0] < 1e-6
          )
            connectedPours.add(other)
        }
      }
      expect(
        circuit.db.pcb_via
          .list()
          .some(
            (via) =>
              via.layers.includes("top") &&
              connMap.areIdsConnected(via.pcb_via_id, sourceNetId) &&
              [...connectedPours].some(
                ({ polygon }) =>
                  polygon.contains(point(via.x, via.y)) ||
                  polygon.distanceTo(point(via.x, via.y))[0] <=
                    via.outer_diameter / 2,
              ),
          ),
      ).toBe(true)
    }

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
    // Fixed manual RF paths no longer acquire trace-via clearance violations.
    expect(circuit.db.pcb_pad_pad_clearance_error.list()).toEqual([])

    const topSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-top.test.tsx",
    )
    const bottomSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-bottom.test.tsx",
    )

    // CI differs at thin copper-pour seams: 0.15% on top and 0.24% when
    // layers overlap. Geometry and clearance assertions above stay exact.
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
