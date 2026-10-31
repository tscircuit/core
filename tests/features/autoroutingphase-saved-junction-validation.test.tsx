import { expect, test } from "bun:test"
import type { FanoutTracePath } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const wire = (x: number, y: number, layer: "top" | "bottom" = "top") => ({
  route_type: "wire" as const,
  x,
  y,
  layer,
  width: 0.2,
})

test("saved branches require prior copper on the same connection and layer", async () => {
  for (const scenario of [
    "connected",
    "gap",
    "wrong-layer",
    "other-net",
    "branch-first",
  ] as const) {
    const layer = scenario === "wrong-layer" ? "bottom" : "top"
    const paths: FanoutTracePath[] = [
      { connection: "A.1", route: [wire(-4, 0), wire(4, 0)] },
      {
        connection: "C.1",
        route: [
          wire(0, 3, layer),
          wire(0, scenario === "gap" ? 0.25 : 0, layer),
        ],
      },
    ]
    if (scenario === "branch-first") paths.reverse()
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={16} height={12}>
        {[
          { name: "A", x: -4, y: 0 },
          { name: "B", x: 4, y: 0 },
          { name: "C", x: 0, y: 3 },
          { name: "D", x: 4, y: 3 },
        ].map(({ name, x, y }) => (
          <chip
            key={name}
            name={name}
            pcbX={x}
            pcbY={y}
            layer={name === "C" ? layer : "top"}
            pinLabels={{ pin1: "SIGNAL" }}
            footprint={
              <footprint>
                <smtpad
                  portHints={["1"]}
                  width={0.6}
                  height={0.6}
                  shape="rect"
                />
              </footprint>
            }
            connections={
              name === "D" && scenario !== "other-net"
                ? undefined
                : {
                    SIGNAL:
                      (name === "C" || name === "D") && scenario === "other-net"
                        ? "net.OTHER"
                        : "net.SIGNAL",
                  }
            }
          />
        ))}
        <autoroutingphase pcbTracePaths={paths} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const messages = circuit.db.pcb_autorouting_error
      .list()
      .map((e) => e.message)
    if (scenario === "connected") {
      expect(messages).toEqual([])
      expect(circuit.db.pcb_trace.list()).toHaveLength(2)
    } else {
      expect(messages.join("\n"), scenario).toContain(
        "must end at another connection endpoint",
      )
    }
  }
})
