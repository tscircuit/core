import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("placement preview skips the local router and unavailable routing cache", async () => {
  let autoroutingStartCount = 0
  let cacheReadCount = 0
  let cacheWriteCount = 0
  const { circuit } = getTestFixture({
    platform: {
      routingDisabled: true,
      localCacheEngine: {
        getItem: () => {
          cacheReadCount++
          throw new Error("Routing cache is unavailable")
        },
        setItem: () => {
          cacheWriteCount++
          throw new Error("Routing cache is unavailable")
        },
      },
    },
  })
  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board width="24mm" height="10mm">
      <subcircuit name="child" routingDisabled={false}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-3}
          schX={-3}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          schX={3}
        />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </subcircuit>
      <pcbnotetext
        text="Placement preview: connected R1 and R2"
        pcbY={3}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Expected: ratsnest, no router or cache calls"
        pcbY={-3}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingStartCount).toBe(0)
  expect(cacheReadCount).toBe(0)
  expect(cacheWriteCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_component.list()).toHaveLength(2)
  expect(circuit.db.pcb_port.list()).toHaveLength(4)
  expect(circuit.db.source_trace.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
  })
})
