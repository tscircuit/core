import { expect, test } from "bun:test"
import {
  doSegmentsIntersect,
  pointToSegmentDistance,
} from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fixed net labels preserve routes from projected custom-symbol terminals", async () => {
  const cases = [
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
  } of cases) {
    const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
    circuit.add(
      <board>
        <chip
          name="U1"
          pinLabels={{ pin1: "OUT" }}
          connections={{ pin1: ".R1 > .pin1" }}
          symbol={
            <symbol>
              <schematicrect width={2} height={2} />
              <schematictext text="{NAME}" schY={1.3} fontSize={0.2} />
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
    const port = circuit.db.schematic_port
      .list()
      .find((port) => port.display_pin_label === "OUT")!
    const component = circuit.db.schematic_component.get(
      port.schematic_component_id!,
    )!
    const label = circuit.db.schematic_net_label
      .list()
      .find((label) => label.text === "GND")!
    // The custom symbol intentionally starts its pin inside its body. Routing
    // projects that terminal to the body boundary instead of drawing through
    // the symbol. Derive the expected point from emitted bounds and direction.
    // Points are in circuit-world mm, +X right and +Y up.
    const terminal = { ...port.center }
    switch (port.facing_direction) {
      case "right":
        terminal.x = component.center.x + component.size.width / 2
        break
      case "left":
        terminal.x = component.center.x - component.size.width / 2
        break
      case "up":
        terminal.y = component.center.y + component.size.height / 2
        break
      case "down":
        terminal.y = component.center.y - component.size.height / 2
        break
    }
    const edges = circuit.db.schematic_trace
      .list()
      .flatMap((trace) => trace.edges)
    const connected = new Set(
      edges.filter(
        (edge) =>
          pointToSegmentDistance(label.anchor_position!, edge.from, edge.to) <
          1e-6,
      ),
    )
    let previousSize = -1
    while (previousSize !== connected.size) {
      previousSize = connected.size
      for (const edge of edges) {
        if (
          [...connected].some((other) =>
            doSegmentsIntersect(edge.from, edge.to, other.from, other.to),
          )
        )
          connected.add(edge)
      }
    }
    expect(
      [...connected].some(
        (edge) => pointToSegmentDistance(terminal, edge.from, edge.to) < 1e-6,
      ),
    ).toBe(true)
    await expect(circuit).toMatchSchematicSnapshot(
      import.meta.path + `.${direction}`,
      { grid: false },
    )
  }
})
