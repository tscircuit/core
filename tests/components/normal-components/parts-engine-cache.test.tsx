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
})
