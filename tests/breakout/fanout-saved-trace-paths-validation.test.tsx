import { expect, test } from "bun:test"
import { fanoutTracePath, type FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved fanout paths reject invalid layers, anchors, and incomplete coverage", async () => {
  const wire = {
    route_type: "wire" as const,
    x: 0,
    y: 0,
    width: 0.2,
    layer: "top" as const,
  }
  expect(
    fanoutTracePath.safeParse({ connection: "U1.1", route: [wire] }).success,
  ).toBe(false)
  expect(
    fanoutTracePath.safeParse({
      connection: "U1.1",
      route: [wire, { ...wire, layer: "bottom" }],
    }).success,
  ).toBe(false)
  for (const [paths, error] of [
    [
      [
        {
          connection: "U1.1",
          route: [
            { ...wire, x: 1 },
            { ...wire, x: 3 },
          ],
        },
      ],
      "must start at its PCB port",
    ],
    [
      [
        {
          connection: "U1.1",
          route: [
            { ...wire, layer: "inner1" },
            { ...wire, x: 3, layer: "inner1" },
          ],
        },
      ],
      "unavailable on this board",
    ],
    [[], "must cover every fanout connection"],
    [
      [
        {
          connection: "U1.1",
          route: [
            {
              route_type: "via",
              x: 0,
              y: 0,
              from_layer: "top",
              to_layer: "bottom",
            },
            { ...wire, x: 3, layer: "bottom" },
          ],
        },
      ],
      "enable allowViaInPad",
    ],
  ] as [FanoutTracePath[], string][]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={20} height={20}>
        <fanout name="saved" pcbTracePaths={paths}>
          <chip
            name="U1"
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
          />
        </fanout>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={6} />
        <trace from="U1.1" to="R1.1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.pcb_autorouting_error
        .list()
        .some((entry) => entry.message.includes(error)),
    ).toBe(true)
  }
})
