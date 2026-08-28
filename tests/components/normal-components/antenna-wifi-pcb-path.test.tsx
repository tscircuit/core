import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("antenna renders a placed footprint and WiFi pcbPath", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="32mm" height="16mm" minTraceWidth="0.4mm">
      <antenna
        name="ANT1"
        pcbX={-12}
        pcbY={-1}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              portHints={["pin1"]}
            />
          </footprint>
        }
        pcbPath={[
          { x: 1, y: 0 },
          { x: 1, y: 5 },
          { x: 12, y: 5 },
          { x: 12, y: 3.5 },
          { x: 3, y: 3.5 },
          { x: 3, y: 2 },
          { x: 12, y: 2 },
          { x: 12, y: 0.5 },
          { x: 3, y: 0.5 },
          { x: 3, y: -1 },
          { x: 12, y: -1 },
        ]}
      />
      <pcbnotetext
        text="WiFi antenna drawn with <antenna pcbPath>"
        pcbX={0}
        pcbY={-6.5}
        fontSize="0.8mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const antennaSourceComponent = circuit.db.source_component.getWhere({
    name: "ANT1",
  })
  const antennaPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: antennaSourceComponent!.source_component_id,
  })
  const antennaPcbTrace = circuit.db.pcb_trace.list()[0]

  expect(antennaPcbComponent?.center).toEqual({ x: -12, y: -1 })
  expect(antennaPcbTrace.route[0]).toMatchObject({ x: -12, y: -1 })
  expect(antennaPcbTrace.route.at(-1)).toMatchObject({ x: 0, y: -2 })

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
