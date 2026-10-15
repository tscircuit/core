import { expect, test } from "bun:test"
import {
  doSegmentsIntersect,
  pointToSegmentDistance,
} from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fixed net labels preserve routes from projected custom-symbol terminals", async () => {
  const terminalDirectionCases = [
    {
      direction: "right",
      x: 0.5,
      y: 0,
      resistorX: 3,
      resistorY: 0,
      rotation: 0,
      labelX: 2,
      labelY: -1,
      anchor: "top",
    },
    {
      direction: "up",
      x: 0,
      y: 0.5,
      resistorX: 0,
      resistorY: 3,
      rotation: 90,
      labelX: 1,
      labelY: 2,
      anchor: "left",
    },
    {
      direction: "left",
      x: -0.5,
      y: 0,
      resistorX: -3,
      resistorY: 0,
      rotation: 180,
      labelX: -2,
      labelY: 1,
      anchor: "bottom",
    },
    {
      direction: "down",
      x: 0,
      y: -0.5,
      resistorX: 0,
      resistorY: -3,
      rotation: 270,
      labelX: -1,
      labelY: -2,
      anchor: "right",
    },
  ] as const
  for (const {
    direction,
    x,
    y,
    resistorX,
    resistorY,
    rotation,
    labelX,
    labelY,
    anchor,
  } of terminalDirectionCases) {
    const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
    const captionX = resistorX / 2
    const captionY = Math.max(1.6, resistorY + 0.6, labelY + 0.6) + 1.2
    circuit.add(
      <board>
        <schematictext
          text={`Projected terminal: ${direction}-facing pin`}
          schX={captionX}
          schY={captionY}
          fontSize={0.24}
        />
        <schematictext
          text="Test input: the red OUT pin stem is intentionally inside U1."
          schX={captionX}
          schY={captionY - 0.4}
          fontSize={0.18}
        />
        <schematictext
          text="Expected: the green wire connects U1's border to R1 and GND."
          schX={captionX}
          schY={captionY - 0.75}
          fontSize={0.18}
        />
        <chip
          name="U1"
          pinLabels={{ pin1: "OUT" }}
          connections={{ pin1: ".R1 > .pin1" }}
          symbol={
            <symbol>
              <schematicrect width={2} height={2} strokeWidth={0.02} />
              <schematictext
                text="{NAME}"
                schX={-0.65}
                schY={1.3}
                fontSize={0.2}
              />
              <port
                name="OUT"
                pinNumber={1}
                schX={x}
                schY={y}
                direction={direction}
                schStemLength={0.5}
              />
            </symbol>
          }
        />
        <resistor
          name="R1"
          resistance="1k"
          schX={resistorX}
          schY={resistorY}
          schRotation={rotation}
          connections={{ pin1: "net.GND" }}
        />
        <netlabel
          net="GND"
          connection=".R1 > .pin1"
          schX={labelX}
          schY={labelY}
          anchorSide={anchor}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const schematicPort = circuit.db.schematic_port
      .list()
      .find((schematicPort) => schematicPort.display_pin_label === "OUT")!
    const schematicComponent = circuit.db.schematic_component.get(
      schematicPort.schematic_component_id!,
    )!
    const groundLabel = circuit.db.schematic_net_label
      .list()
      .find((groundLabel) => groundLabel.text === "GND")!
    // The custom symbol intentionally starts its pin inside its body. Routing
    // projects that terminal to the body boundary instead of drawing through
    // the symbol. Derive the expected point from emitted bounds and direction.
    // Points are in circuit-world mm, +X right and +Y up.
    const projectedTerminal = { ...schematicPort.center }
    switch (schematicPort.facing_direction) {
      case "right":
        projectedTerminal.x =
          schematicComponent.center.x + schematicComponent.size.width / 2
        break
      case "left":
        projectedTerminal.x =
          schematicComponent.center.x - schematicComponent.size.width / 2
        break
      case "up":
        projectedTerminal.y =
          schematicComponent.center.y + schematicComponent.size.height / 2
        break
      case "down":
        projectedTerminal.y =
          schematicComponent.center.y - schematicComponent.size.height / 2
        break
    }
    const edges = circuit.db.schematic_trace
      .list()
      .flatMap((trace) => trace.edges)
    const connectedEdges = new Set(
      edges.filter(
        (edge) =>
          pointToSegmentDistance(
            groundLabel.anchor_position!,
            edge.from,
            edge.to,
          ) < 1e-6,
      ),
    )
    let previousConnectedEdgeCount = -1
    while (previousConnectedEdgeCount !== connectedEdges.size) {
      previousConnectedEdgeCount = connectedEdges.size
      for (const edge of edges) {
        if (
          [...connectedEdges].some((connectedEdge) =>
            doSegmentsIntersect(
              edge.from,
              edge.to,
              connectedEdge.from,
              connectedEdge.to,
            ),
          )
        )
          connectedEdges.add(edge)
      }
    }
    expect(
      [...connectedEdges].some(
        (edge) =>
          pointToSegmentDistance(projectedTerminal, edge.from, edge.to) < 1e-6,
      ),
    ).toBe(true)
    await expect(circuit).toMatchSchematicSnapshot(
      import.meta.path + `.${direction}`,
      { grid: false },
    )
  }
})
