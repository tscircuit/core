import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mixed plane and boundary fanout keeps signal branches isolated", async () => {
  const { circuit } = getTestFixture()
  const fanoutOptions: unknown[] = []
  circuit.on("solver:started", (event) => {
    if (event.solverName === "FanoutSolver") {
      fanoutOptions.push(event.solverConstructorArgs?.[1])
    }
  })
  circuit.add(
    <board width={14} height={8} layers={4}>
      <autoroutingphase
        autorouter="fanout"
        fanoutBoundaryPadding={1}
        fanoutPourNetMap={{ inner1: "GND" }}
        busFanoutDirections={{ SIGNAL: "center_right" }}
      />
      <chip
        name="U1"
        pinLabels={{ pin1: "GND", pin2: "SIGNAL" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={0.5}
              height={0.5}
              pcbX={-1}
            />
            <smtpad
              portHints={["pin2"]}
              shape="rect"
              width={0.5}
              height={0.5}
              pcbX={1}
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} />
      <bus name="SIGNAL" connections={["SIGNAL"]} />
      <trace name="GND" from=".U1 > .pin1" to="net.GND" />
      <trace name="SIGNAL" from=".U1 > .pin2" to=".R1 > .pin1" />
      <pcbnotetext
        text="Mixed GND plane + signal fanout: branches stay isolated"
        pcbY={3}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(fanoutOptions).toHaveLength(1)
  expect(fanoutOptions[0]).toMatchObject({
    allowSameNetMerges: false,
    buses: [
      { termination: { type: "plane", layer: "inner1" } },
      { busId: "SIGNAL" },
    ],
  })
  expect(
    circuit.db.pcb_via.list().some((via) => via.to_layer === "inner1"),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
