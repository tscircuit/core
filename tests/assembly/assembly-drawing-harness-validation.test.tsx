import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("harness drawings reject invalid wiring, missing cables and balloons without a parts list", async () => {
  const wired = [
    <assembly.cablewire key="1" fromPin={1} toPin={1} />,
    <assembly.cablewire key="2" fromPin={2} toPin={2} />,
  ]
  const view = { cableRef: "HARNESS", width: 180, height: 70 }
  const table = { paperX: 0, paperY: 0, anchorAlignment: "center" as const }
  for (const [wires, pageChildren, error] of [
    [
      <assembly.cablewire fromPin={7} toPin={1} />,
      <assembly.drawing.harnessview {...view} />,
      "its from connector has 6 contacts",
    ],
    [
      [
        <assembly.cablewire key="1" fromPin={1} toPin={2} />,
        <assembly.cablewire key="2" fromPin={3} toPin={2} />,
      ],
      <assembly.drawing.harnessview {...view} />,
      "lands two wires on toPin=2",
    ],
    [
      <assembly.part name="not-a-wire" />,
      <assembly.drawing.harnessview {...view} />,
      "can contain only assembly.cablewire children",
    ],
    [
      wired,
      <assembly.drawing.harnessview {...view} cableRef="MISSING" />,
      "must select exactly one assembly.cable; matched 0",
    ],
    [
      undefined,
      <assembly.drawing.harnessview {...view} />,
      "needs assembly.cablewire children",
    ],
    [
      undefined,
      <assembly.drawing.wiringtable cableRef="HARNESS" {...table} />,
      "has no assembly.cablewire children to list",
    ],
    [
      wired,
      <assembly.drawing.harnessview {...view} showBalloons />,
      "showBalloons needs an assembly.drawing.bomtable",
    ],
    [
      wired,
      <assembly.drawing.bomtable partRef="MISSING" {...table} />,
      "must select exactly one assembly part; matched 0",
    ],
    [
      undefined,
      <assembly.drawing.bomtable partRef="HARNESS" {...table} />,
      "has no BOM items to list",
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <board width={50} height={25} routingDisabled>
          <connector
            name="J1"
            standard="jst_ph"
            pinCount={6}
            pcbX={-15}
            footprint="jst6_ph"
          />
          <connector
            name="J2"
            standard="jst_ph"
            pinCount={6}
            pcbX={15}
            footprint="jst6_ph"
          />
        </board>
        <assembly.cable name="HARNESS" from=".J1" to=".J2">
          {wires}
        </assembly.cable>
        <assembly.drawing.page width={297} height={210}>
          {pageChildren}
        </assembly.drawing.page>
      </assembly.device>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
    expect(circuit.db.drawing_page.list()).toHaveLength(0)
    expect(circuit.db.drawing_table.list()).toHaveLength(0)
  }
  for (const [children, error] of [
    [
      <assembly.cablewire fromPin={1} toPin={1} />,
      "must belong to an assembly.cable",
    ],
    [
      <assembly.drawing.harnessview {...view} />,
      "must belong to a drawing page",
    ],
    [
      <assembly.drawing.wiringtable cableRef="HARNESS" {...table} />,
      "must belong to a drawing page",
    ],
    [<assembly.drawing.bomtable {...table} />, "must belong to a drawing page"],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(<assembly.device>{children}</assembly.device>)
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
  }
})
