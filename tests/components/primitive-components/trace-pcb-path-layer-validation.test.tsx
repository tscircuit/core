import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPath validates endpoint layers and explicit via transitions", async () => {
  const cases = [
    {
      name: "via entry constrains multilayer start",
      start: "pin1",
      end: "top",
      pcbPath: [{ x: 0, y: 1, via: true, fromLayer: "bottom", toLayer: "top" }],
      valid: true,
    },
    {
      name: "incompatible endpoints",
      start: "top",
      end: "bottom",
      pcbPath: [],
      valid: false,
    },
    {
      name: "valid transition",
      start: "top",
      end: "bottom",
      pcbPath: [{ x: 0, y: 1, via: true, toLayer: "bottom" }],
      valid: true,
    },
    {
      name: "invalid via entry",
      start: "top",
      end: "bottom",
      pcbPath: [
        { x: 0, y: 1, via: true, fromLayer: "bottom", toLayer: "bottom" },
      ],
      valid: false,
    },
    {
      name: "invalid final layer",
      start: "top",
      end: "top",
      pcbPath: [{ x: 0, y: 1, via: true, toLayer: "bottom" }],
      valid: false,
    },
    {
      name: "invalid second transition",
      start: "top",
      end: "top",
      pcbPath: [
        { x: 0, y: 1, via: true, toLayer: "bottom" },
        { x: 1, y: 1, via: true, fromLayer: "top", toLayer: "top" },
      ],
      valid: false,
    },
  ] as const
  for (const scenario of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={10} height={10} schematicDisabled routingDisabled>
        <via name="V1" pcbX={-2} fromLayer="top" toLayer="bottom" />
        <via name="V2" pcbX={2} fromLayer="top" toLayer="bottom" />
        <trace
          from={`.V1 > .${scenario.start}`}
          to={`.V2 > .${scenario.end}`}
          pcbPath={[...scenario.pcbPath]}
        />
        <pcbnotetext pcbY={-3} text={scenario.name} />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(scenario.valid ? 1 : 0)
    expect(circuit.db.pcb_via.list()).toHaveLength(scenario.valid ? 3 : 2)
    if (scenario.name === "via entry constrains multilayer start") {
      expect(circuit.db.pcb_trace.list()[0].route[0]).toMatchObject({
        route_type: "wire",
        layer: "bottom",
      })
    }
    const errors = circuit.db.pcb_trace_error.list()
    expect(errors).toHaveLength(scenario.valid ? 0 : 1)
    if (!scenario.valid)
      expect(errors[0].message).toContain("no compatible layer")
    await expect(circuit).toMatchPcbSnapshot(
      `${import.meta.path}-${scenario.name.replaceAll(" ", "-")}`,
    )
  }
})
