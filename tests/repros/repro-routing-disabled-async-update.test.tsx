import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routingDisabled remains effective after async chip metadata updates", async () => {
  let partRequests = 0
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: async () => {
          partRequests++
          await Bun.sleep(1)
          return { jlcpcb: ["C25804"] }
        },
        fetchPartCircuitJson: async () => {
          partRequests++
          await Bun.sleep(1)
          return []
        },
      },
    },
  })
  let routingStarts = 0
  circuit.on("autorouting:start", () => {
    routingStarts++
  })
  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        manufacturerPartNumber="NE555"
        supplierPartNumbers={{ jlcpcb: ["C46749"] }}
        pinAttributes={{ pin8: { requiresPower: true } }}
        pcbX={-4}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={4} />
      <trace from=".U1 > .pin1" to=".R2 > .pin1" />
      <pcbnotetext
        text="Async metadata, routing disabled"
        pcbY={-3.5}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(partRequests).toBeGreaterThan(0)
  expect(routingStarts).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.source_trace.list().length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
