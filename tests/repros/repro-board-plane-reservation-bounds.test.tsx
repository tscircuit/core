import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const caption = (lines: string[]) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${lines.length * 28 + 20}">
    <rect width="100%" height="100%" fill="#111827" />
    ${lines.map((line, index) => `<text x="20" y="${30 + index * 28}" fill="#f1f5f9" font-family="Arial, sans-serif" font-size="18">${line}</text>`).join("")}
  </svg>`

test("child groups do not shrink the board's unbroken plane reservation", async () => {
  const panels: string[] = []
  for (const grouped of [false, true]) {
    const { circuit } = getTestFixture()
    let autorouterInput: SimpleRouteJson | undefined
    circuit.on("autorouting:start", ({ simpleRouteJson }) => {
      autorouterInput = structuredClone(simpleRouteJson)
      // Capture the real first-pass input before physical copper pours exist.
      expect(circuit.db.pcb_copper_pour.list()).toHaveLength(0)
    })
    circuit.add(
      <board
        width={30}
        height={20}
        layers={4}
        autorouter="auto-local"
        schematicDisabled
      >
        <net name="GND" isGroundNet />
        <copperpour connectsTo="net.GND" layer="inner1" unbroken />
        {grouped ? (
          <group name="LOCAL" width={8} height={6} pcbX={5}>
            <resistor
              name="R1"
              footprint="0603"
              resistance="1k"
              connections={{ pin1: "net.GND" }}
            />
          </group>
        ) : (
          <resistor
            name="R1"
            pcbX={5}
            footprint="0603"
            resistance="1k"
            connections={{ pin1: "net.GND" }}
          />
        )}
        <resistor
          name="R2"
          pcbX={-10}
          footprint="0603"
          resistance="1k"
          connections={{ pin1: "net.GND" }}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    const board = circuit.db.pcb_board.list()[0]!
    const group = circuit.db.pcb_group.list()[0]
    const input = autorouterInput!
    const planes = input.obstacles.filter((obstacle) => obstacle.isCopperPour)
    expect(input.bounds).toEqual({ minX: -15, maxX: 15, minY: -10, maxY: 10 })
    expect(planes).toHaveLength(1)
    expect(planes[0]).toMatchObject({
      center: board.center,
      width: board.width,
      height: board.height,
      layers: ["inner1"],
    })

    if (group) {
      // Explicitly requested group routing must retain its local reservation.
      const { simpleRouteJson: localInput } = getSimpleRouteJsonFromCircuitJson(
        {
          db: circuit.db,
          subcircuit_id: board.subcircuit_id,
          subcircuitComponent: circuit.firstChild!,
          routingPcbGroupId: group.pcb_group_id,
        },
      )
      expect(
        localInput.obstacles.filter((obstacle) => obstacle.isCopperPour),
      ).toMatchObject([
        { center: group.center, width: group.width, height: group.height },
      ])
    }

    const groundPoints = input.connections.flatMap(
      (connection) => connection.pointsToConnect,
    )
    // Draw emitted circuit-world geometry in mm, +X right, +Y up, right-handed
    // with +Z toward the top PCB layer. Graphics-debug handles the SVG transform.
    // These are visual annotations of router input, never replacement copper.
    const geometry = getSvgFromGraphicsObject(
      {
        rects: [
          ...planes.map((plane) => ({
            center: plane.center,
            width: plane.width,
            height: plane.height,
            fill: "#164e63",
            stroke: "#22d3ee",
          })),
        ],
        polygons: [
          { bounds: board, stroke: "#f8fafc" },
          ...(group ? [{ bounds: group, stroke: "#fb923c" }] : []),
        ].map(({ bounds, stroke }) => ({
          points: [
            {
              x: bounds.center.x - bounds.width! / 2,
              y: bounds.center.y - bounds.height! / 2,
            },
            {
              x: bounds.center.x + bounds.width! / 2,
              y: bounds.center.y - bounds.height! / 2,
            },
            {
              x: bounds.center.x + bounds.width! / 2,
              y: bounds.center.y + bounds.height! / 2,
            },
            {
              x: bounds.center.x - bounds.width! / 2,
              y: bounds.center.y + bounds.height! / 2,
            },
          ],
          stroke,
          strokeWidth: 0.08,
          fill: "none",
        })),
        circles: groundPoints.map((point) => ({
          center: point,
          radius: 0.22,
          fill: "#fde047",
        })),
        texts: groundPoints.map((point) => {
          const pcbPort = circuit.db.pcb_port.get(point.pcb_port_id!)!
          const sourcePort = circuit.db.source_port.get(pcbPort.source_port_id)!
          const component = circuit.db.source_component.get(
            sourcePort.source_component_id!,
          )!
          return {
            x: point.x,
            y: point.y - 1.4,
            text: `${component.name}.pin${sourcePort.pin_number} = GND`,
            color: "#f8fafc",
            fontSize: 0.9,
            anchorSide: "center" as const,
          }
        }),
      },
      {
        svgWidth: 600,
        svgHeight: 400,
        backgroundColor: "#111827",
        hideInlineLabels: true,
      },
    )
    const plane = planes[0]!
    panels.push(
      stackSvgsVertically(
        [
          caption([
            grouped
              ? "SAME BOARD + ORDINARY CHILD GROUP"
              : "CONTROL: NO CHILD GROUP",
            "Declared plane: full 30 x 20 mm board, inner1 GND",
            `Router receives: ${plane.width} x ${plane.height} mm at (${plane.center.x}, ${plane.center.y})`,
          ]),
          geometry,
          caption([
            "White border = declared board / intended plane extent",
            "Blue fill = actual plane reservation sent to the router",
            grouped
              ? "Orange border = unrelated 8 x 6 mm child group"
              : "Both GND pins lie above the reserved inner1 plane",
            "Yellow dots = top-layer GND pins; no copper is drawn",
          ]),
        ],
        { gap: 0, normalizeSize: false },
      ),
    )
  }
  await expect(
    stackSvgsHorizontally(panels, { gap: 16, normalizeSize: false }).replace(
      /[ \t]+$/gm,
      "",
    ),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
