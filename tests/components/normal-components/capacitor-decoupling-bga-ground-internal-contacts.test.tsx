import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("BGA ground contacts with V-row addresses do not become power inputs through internal connections", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} routingDisabled>
      <chip
        name="U1"
        pinLabels={{
          pin1: ["A1", "VDD"],
          pin2: ["A2", "VSS"],
          pin3: ["V3", "VSS"],
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["1", "A1"]}
              pcbX={-1}
              pcbY={1}
              shape="circle"
              radius={0.3}
            />
            <smtpad
              portHints={["2", "A2"]}
              pcbX={1}
              pcbY={1}
              shape="circle"
              radius={0.3}
            />
            <smtpad
              portHints={["3", "V3"]}
              pcbX={1}
              pcbY={-1}
              shape="circle"
              radius={0.3}
            />
          </footprint>
        }
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={-3} />
      <trace from=".C1 > .pin1" to=".U1 > .A1" />
      <trace from=".C1 > .pin2" to=".U1 > .A2" />
      <pcbnotetext
        text="A1: VDD; A2 and V3: internally connected VSS"
        pcbY={3}
        fontSize={0.35}
      />
      <pcbnotetext
        text="C1 is a decoupler: 1mm trace limit"
        pcbY={-3}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const ground = circuit.selectOne(".C1 > .pin2") as Port
  expect(ground.isConnectedToGround()).toBe(true)
  expect(ground.isConnectedToPower()).toBe(false)
  const capacitor = circuit.db.source_component
    .list()
    .find(({ name }) => name === "C1")!
  if (capacitor.ftype !== "simple_capacitor")
    throw new Error("Expected capacitor")
  expect(capacitor.max_decoupling_trace_length).toBe(1)
  expect(
    circuit.db.source_trace.list().map(({ max_length }) => max_length),
  ).toEqual([1, 1])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
