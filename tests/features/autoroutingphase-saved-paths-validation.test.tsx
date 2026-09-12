import { expect, test } from "bun:test"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved phase paths reject invalid ports, layers, anchors, and coverage", async () => {
  const wire = {
    route_type: "wire" as const,
    x: 0,
    y: 0,
    width: 0.2,
    layer: "top" as const,
  }
  const path: FanoutTracePath = {
    connection: "U1.1",
    route: [wire, { ...wire, x: 4 }],
  }
  for (const [paths, error] of [
    [[], "must cover every connection"],
    [[{ ...path, connection: "MISSING.1" }], "must select a PCB port"],
    [[{ ...path, connection: "U3.1" }], "must select exactly one connection"],
    [[path, path], "Duplicate saved phase path"],
    [
      [
        {
          ...path,
          route: [
            { ...wire, x: 1 },
            { ...wire, x: 4 },
          ],
        },
      ],
      "must start at its PCB port",
    ],
    [
      [{ ...path, route: [wire, { ...wire, x: 2 }] }],
      "must end at another connection endpoint",
    ],
    [
      [
        {
          ...path,
          route: [
            { ...wire, layer: "inner1" },
            { ...wire, x: 4, layer: "inner1" },
          ],
        },
      ],
      "unavailable on this board",
    ],
    [
      [
        {
          ...path,
          route: [
            {
              route_type: "via",
              x: 0,
              y: 0,
              from_layer: "top",
              to_layer: "bottom",
            },
            { ...wire, x: 4, layer: "bottom" },
          ],
        },
      ],
      "enable allowViaInPad",
    ],
  ] satisfies [FanoutTracePath[], string][]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={16} height={16}>
        <chip
          name="U1"
          pinLabels={{ pin1: "START" }}
          footprint={
            <footprint>
              <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
            </footprint>
          }
        />
        <chip
          name="U2"
          pcbX={4}
          pinLabels={{ pin1: "END" }}
          footprint={
            <footprint>
              <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
            </footprint>
          }
        />
        <chip
          name="U3"
          pcbX={-4}
          pinLabels={{ pin1: "UNCONNECTED" }}
          footprint={
            <footprint>
              <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
            </footprint>
          }
        />
        <autoroutingphase connection="U1.1" pcbTracePaths={paths} />
        <trace from="U1.1" to="U2.1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.pcb_autorouting_error
        .list()
        .map((error) => error.message)
        .join("\n"),
    ).toContain(error)
  }
})
