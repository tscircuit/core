import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("exports the declared order of both differential pair paths", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={19} height={11} routingDisabled schematicDisabled>
      <pinheader name="A" pinCount={2} pcbX={-6} pcbRotation={90} />
      <pinheader name="B" pinCount={2} pcbX={6} pcbRotation={90} />
      <pinheader name="C" pinCount={2} pcbRotation={90} />

      <trace name="D_P" path={["A.pin1", "B.pin1", "C.pin1"]} />
      <trace name="D_N" path={["A.pin2", "B.pin2", "C.pin2"]} />
      <differentialpair positiveConnection="D_P" negativeConnection="D_N" />
    </board>,
  )
  circuit.render()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })

  expect({
    connections: simpleRouteJson.connections.map(({ name, path }) => ({
      name,
      path,
    })),
    differentialPairs: simpleRouteJson.differentialPairs,
  }).toMatchInlineSnapshot(`
    {
      "connections": [
        {
          "name": "source_trace_0",
          "path": [
            "pcb_port_0",
            "pcb_port_2",
            "pcb_port_4",
          ],
        },
        {
          "name": "source_trace_1",
          "path": [
            "pcb_port_1",
            "pcb_port_3",
            "pcb_port_5",
          ],
        },
      ],
      "differentialPairs": [
        {
          "connectionNames": [
            "source_trace_0",
            "source_trace_1",
          ],
          "lengthTolerance": 0.1,
        },
      ],
    }
  `)
})
