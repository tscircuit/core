import { expect, test } from "bun:test"
import { Circuit } from "lib"
import { su } from "@tscircuit/circuit-json-util"

test("routingDisabled is preserved when an async effect triggers an update pass (fixes tscircuit/tscircuit#5563)", async () => {
  const delay = () => new Promise((r) => setTimeout(r, 20))
  let autoroutingStarted = 0

  const circuit = new Circuit({
    platform: {
      partsEngine: {
        findPart: async () => {
          await delay()
          return { jlcpcb: ["C25804"] }
        },
        fetchPartCircuitJson: async () => {
          await delay()
          return []
        },
      },
    },
  })

  circuit.on("autorouting:start", () => {
    autoroutingStarted++
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
        pcbY={0}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={4} pcbY={0} />
      <trace from=".U1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingStarted).toBe(0)
  expect(su(circuit.getCircuitJson()).pcb_trace.list()).toHaveLength(0)
})
