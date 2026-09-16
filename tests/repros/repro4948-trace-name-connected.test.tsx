import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("platform routingDisabled allows mutually connected traces with the same name", async () => {
  const { circuit } = getTestFixture({ platform: { routingDisabled: true } })

  circuit.add(
    <board name="main" width="26mm" height="16mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={3}
        schX={-6}
        schY={3}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={6}
        pcbY={3}
        schX={6}
        schY={3}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={6}
        pcbY={-3}
        schX={6}
        schY={-3}
      />
      <trace name="signal" from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace name="signal" from=".R2 > .pin1" to=".R3 > .pin1" />
      <pcbnotetext
        text="Same trace name, shared R2.pin1"
        pcbY={6.5}
        fontSize={0.5}
      />
      <pcbnotetext
        text="signal: R1.pin2 to R2.pin1"
        pcbY={1.5}
        fontSize={0.4}
      />
      <pcbnotetext
        text="signal: R2.pin1 to R3.pin1"
        pcbY={-4.5}
        fontSize={0.4}
      />
      <pcbnotetext
        text="Platform preview: connected same-name traces are allowed"
        pcbY={-6.5}
        fontSize={0.4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTraces = circuit.db.source_trace.list()
  expect(sourceTraces).toHaveLength(2)
  expect(sourceTraces[0]!.subcircuit_connectivity_map_key).toBe(
    sourceTraces[1]!.subcircuit_connectivity_map_key,
  )
  expect(circuit.db.pcb_trace_error.list()).toEqual([])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1600,
    height: 1100,
    shouldDrawRatsNest: true,
    showErrorsInTextOverlay: true,
  })
})
