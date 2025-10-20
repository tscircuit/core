import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"

const getTraceSelectors = (trace: Trace) => {
  const props = trace.props as any
  const fromValue = props.from
  const toValue = props.to
  const from =
    typeof fromValue === "string"
      ? fromValue
      : (fromValue?.getPortSelector?.() ?? null)
  const to =
    typeof toValue === "string"
      ? toValue
      : (toValue?.getPortSelector?.() ?? null)

  return { from, to }
}

test("group port connects internal and external components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1">
        <port name="INPUT" direction="right" connectsTo="R1.pin1" />
        <resistor name="R1" footprint="0402" resistance="1k" />
      </group>
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        connections={{ pin1: "G1.INPUT" }}
      />
    </board>,
  )

  await circuit.render()
  await circuit.render()

  const traces = circuit.selectAll("trace") as Trace[]
  const selectors = traces.map(getTraceSelectors)
  expect(traces.length).toBeGreaterThanOrEqual(2)

  const groupPort = circuit.selectOne("group[name='G1'] port") as any
  expect(groupPort?._parsedProps.connectsTo).toBe("R1.pin1")

  expect(
    selectors.some(
      ({ from, to }) => from?.includes("port.INPUT") && to === "R1.pin1",
    ),
  ).toBeTrue()

  expect(
    selectors.some(
      ({ from, to }) =>
        typeof from === "string" && from.includes(".R2") && to === "G1.INPUT",
    ),
  ).toBeTrue()

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces).toHaveLength(2)
  const connectivityKeys = new Set(
    sourceTraces
      .map((trace) => trace.subcircuit_connectivity_map_key)
      .filter(Boolean),
  )

  expect(connectivityKeys.size).toBe(1)
})
