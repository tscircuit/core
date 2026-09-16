import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing enabled exercises the local router and routing cache", async () => {
  let autoroutingStartCount = 0
  let cacheReadCount = 0
  let cacheWriteCount = 0
  const { circuit } = getTestFixture({
    platform: {
      localCacheEngine: {
        getItem: () => {
          cacheReadCount++
          return null
        },
        setItem: () => {
          cacheWriteCount++
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
        text="Routing enabled: connected R1 and R2"
        pcbY={3}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Expected: routed copper, router and cache calls"
        pcbY={-3}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingStartCount).toBeGreaterThan(0)
  expect(cacheReadCount).toBeGreaterThan(0)
  expect(cacheWriteCount).toBeGreaterThan(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
