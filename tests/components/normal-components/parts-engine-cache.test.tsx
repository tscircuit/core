import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import "lib/register-catalogue"

const createBoard = (partsEngine: any) => (
  <board partsEngine={partsEngine} width="20mm" height="20mm">
    <resistor name="R1" resistance="10k" footprint="0402" />
  </board>
)

test("parts engine uses local cache when available", async () => {
  const cache: Record<string, string> = {}
  const localCacheEngine: LocalCacheEngine = {
    getItem: (k) => cache[k] ?? null,
    setItem: (k, v) => {
      cache[k] = v
    },
  }

  let calls = 0
  const partsEngine = {
    findPart: async () => {
      calls++
      return { digikey: ["123"] }
    },
  }

  const circuit1 = new RootCircuit({ platform: { localCacheEngine } })
  circuit1.add(createBoard(partsEngine))
  await circuit1.renderUntilSettled()
  expect(calls).toBe(1)
  expect(
    circuit1.db.source_missing_manufacturer_part_number_warning.list(),
  ).toHaveLength(0)

  const partsEngine2 = {
    findPart: async () => {
      calls++
      return { digikey: ["123"] }
    },
  }
  const circuit2 = new RootCircuit({ platform: { localCacheEngine } })
  circuit2.add(createBoard(partsEngine2))
  await circuit2.renderUntilSettled()

  expect(calls).toBe(1)
  expect(
    circuit2.db.source_missing_manufacturer_part_number_warning.list(),
  ).toHaveLength(0)
})

test("parts engine cache key includes resistance, capacitance, and LED color (#5566)", async () => {
  const cache: Record<string, string> = {}
  const localCacheEngine: LocalCacheEngine = {
    getItem: (k) => cache[k] ?? null,
    setItem: (k, v) => {
      cache[k] = v
    },
  }

  let calls = 0
  const partsEngine = {
    findPart: async ({ sourceComponent }: any) => {
      calls++
      if (sourceComponent.ftype === "simple_resistor") {
        return {
          jlcpcb: [
            sourceComponent.resistance === 10000 ? "C25804" : "C21190",
          ],
        }
      }
      if (sourceComponent.ftype === "simple_capacitor") {
        return {
          jlcpcb: [
            sourceComponent.capacitance === 1e-7 ? "C14663" : "C19702",
          ],
        }
      }
      if (sourceComponent.ftype === "simple_led") {
        return {
          jlcpcb: [sourceComponent.color === "red" ? "C3030991" : "C5197644"],
        }
      }
      return {}
    },
  }

  const circuit1 = new RootCircuit({ platform: { localCacheEngine } })
  circuit1.add(
    <board partsEngine={partsEngine} width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="10k" footprint="0603" pcbX={-3} />
      <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={0} />
      <led name="D1" color="red" footprint="0603" pcbX={3} />
    </board>,
  )
  await circuit1.renderUntilSettled()
  expect(calls).toBe(3)

  const circuit2 = new RootCircuit({ platform: { localCacheEngine } })
  circuit2.add(
    <board partsEngine={partsEngine} width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-3} />
      <capacitor name="C1" capacitance="10uF" footprint="0603" pcbX={0} />
      <led name="D1" color="blue" footprint="0603" pcbX={3} />
    </board>,
  )
  await circuit2.renderUntilSettled()
  expect(calls).toBe(6)

  const getPart = (circuit: RootCircuit, name: string) =>
    circuit.db.source_component
      .list()
      .find((c) => c.name === name)?.supplier_part_numbers?.jlcpcb?.[0]

  expect(getPart(circuit1, "R1")).toBe("C25804")
  expect(getPart(circuit1, "C1")).toBe("C14663")
  expect(getPart(circuit1, "D1")).toBe("C3030991")

  expect(getPart(circuit2, "R1")).toBe("C21190")
  expect(getPart(circuit2, "C1")).toBe("C19702")
  expect(getPart(circuit2, "D1")).toBe("C5197644")
})
