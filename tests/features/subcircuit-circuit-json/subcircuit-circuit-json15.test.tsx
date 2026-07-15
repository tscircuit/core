import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit circuit JSON inflates simple_switch components", async () => {
  const subcircuitCircuitJson = await renderToCircuitJson(
    <board width="14mm" height="10mm">
      <switch
        name="SW1"
        type="dpdt"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-2}
              pcbY={1.5}
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0}
              pcbY={1.5}
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={2}
              pcbY={1.5}
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX={-2}
              pcbY={-1.5}
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin5"]}
              pcbX={0}
              pcbY={-1.5}
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin6"]}
              pcbX={2}
              pcbY={-1.5}
              width="1mm"
              height="1mm"
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="16mm" routingDisabled>
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
      <pcbnotetext
        text="Imported simple_switch (DPDT)"
        pcbX={0}
        pcbY={5}
        fontSize={1}
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((element) => element.type.includes("error"))
  expect(errors).toHaveLength(0)

  const switchComponent = circuit.db.source_component.getWhere({ name: "SW1" })
  expect(switchComponent?.ftype).toBe("simple_switch")
  expect(
    circuit.db.source_port
      .list()
      .filter(
        (port) =>
          port.source_component_id === switchComponent?.source_component_id,
      ),
  ).toHaveLength(6)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
