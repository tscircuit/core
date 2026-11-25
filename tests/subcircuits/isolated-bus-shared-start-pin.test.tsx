import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { SHARED_START_PIN_ROUTES } from "./isolated-bus-shared-start-pin.route"

/** Two unnamed traces share Hub.pin1 and are selected by their ending pins. */
function SharedStartPinBus() {
  return (
    <>
      <resistor name="Hub" resistance="100" footprint="0603" pcbX={-4} />
      <resistor
        name="End1"
        resistance="100"
        footprint="0603"
        pcbX={4}
        pcbY={2}
      />
      <resistor
        name="End2"
        resistance="100"
        footprint="0603"
        pcbX={4}
        pcbY={-2}
      />
      <trace
        from=".Hub > .pin1"
        to=".End1 > .pin1"
        pcbPath={SHARED_START_PIN_ROUTES.End1}
      />
      <trace
        from=".Hub > .pin1"
        to=".End2 > .pin1"
        pcbPath={SHARED_START_PIN_ROUTES.End2}
      />
      <bus
        name="BUS"
        connections={[".End1 > .pin1", ".End2 > .pin1"]}
        maxLengthSkew={0.1}
      />
    </>
  )
}

test.failing("isolated-bus-shared-start-pin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={18}>
      <subcircuit name="Normal" pcbY={4}>
        <SharedStartPinBus />
      </subcircuit>
      <subcircuit name="Isolated" pcbY={-4} _subcircuitCachingEnabled>
        <SharedStartPinBus />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  const { db } = circuit
  for (const name of ["Normal", "Isolated"]) {
    const subcircuit_id = db.source_group.getWhere({ name })?.subcircuit_id
    expect(subcircuit_id).toBeDefined()
    const sourceTraces = db.source_trace.list({ subcircuit_id })
    expect(sourceTraces).toHaveLength(2)
    expect(sourceTraces.every((sourceTrace) => !sourceTrace.name)).toBe(true)
    expect(db.source_bus.list({ subcircuit_id })).toEqual([
      expect.objectContaining({
        name: "BUS",
        max_length_skew: 0.1,
        source_trace_ids: sourceTraces.map(
          (sourceTrace) => sourceTrace.source_trace_id,
        ),
      }),
    ])
  }
})
