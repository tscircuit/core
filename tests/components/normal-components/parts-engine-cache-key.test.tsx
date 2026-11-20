import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { RootCircuit } from "lib/RootCircuit"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import "lib/register-catalogue"

const createMemoryCache = (): LocalCacheEngine => {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }
}

const createSpecPartsEngine = (calls: any[]): PartsEngine => ({
  findPart: async ({ sourceComponent, footprinterString }) => {
    if (sourceComponent.type !== "source_component") return {}

    calls.push({
      ftype: sourceComponent.ftype,
      name: sourceComponent.name,
      resistance: (sourceComponent as any).resistance,
      capacitance: (sourceComponent as any).capacitance,
      color: (sourceComponent as any).color,
      footprinterString,
    })

    if (sourceComponent.ftype === "simple_resistor") {
      const resistance = (sourceComponent as any).resistance
      return {
        jlcpcb: [resistance === 10000 ? "C25804" : "C21190"],
      }
    }
    if (sourceComponent.ftype === "simple_capacitor") {
      const capacitance = (sourceComponent as any).capacitance
      return {
        jlcpcb: [capacitance === 1e-7 ? "C14663" : "C19702"],
      }
    }
    if (sourceComponent.ftype === "simple_led") {
      const color = (sourceComponent as any).color
      return {
        jlcpcb: [color === "red" ? "C3030991" : "C5197644"],
      }
    }
    return {}
  },
})

test("parts engine cache key includes resistance, capacitance, and color when values change", async () => {
  const localCacheEngine = createMemoryCache()
  const calls: any[] = []
  const partsEngine = createSpecPartsEngine(calls)

  const circuit1 = new RootCircuit({
    platform: { localCacheEngine, enablePartOrientationAnalysis: false },
  })
  circuit1.add(
    <board partsEngine={partsEngine} width="12mm" height="8mm" routingDisabled>
      <resistor name="R1" resistance="10k" footprint="0603" pcbX={-3} />
      <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX={0} />
      <led name="D1" color="red" footprint="0603" pcbX={3} />
    </board>,
  )
  await circuit1.renderUntilSettled()

  const firstParts = Object.fromEntries(
    circuit1.db.source_component
      .list()
      .map((component) => [
        component.name,
        component.supplier_part_numbers?.jlcpcb?.[0],
      ]),
  )
  expect(firstParts).toEqual({
    R1: "C25804",
    C1: "C14663",
    D1: "C3030991",
  })
  expect(calls).toHaveLength(3)

  const circuit2 = new RootCircuit({
    platform: { localCacheEngine, enablePartOrientationAnalysis: false },
  })
  circuit2.add(
    <board partsEngine={partsEngine} width="12mm" height="8mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={-3} />
      <capacitor name="C1" capacitance="10uF" footprint="0603" pcbX={0} />
      <led name="D1" color="blue" footprint="0603" pcbX={3} />
    </board>,
  )
  await circuit2.renderUntilSettled()

  const secondParts = Object.fromEntries(
    circuit2.db.source_component
      .list()
      .map((component) => [
        component.name,
        component.supplier_part_numbers?.jlcpcb?.[0],
      ]),
  )
  expect(secondParts).toEqual({
    R1: "C21190",
    C1: "C19702",
    D1: "C5197644",
  })
  expect(calls).toHaveLength(6)
})

test("same-spec components with different names share cache while same-named LEDs of different colors do not collide", async () => {
  const localCacheEngine = createMemoryCache()
  const calls: any[] = []
  const partsEngine = createSpecPartsEngine(calls)

  const redBoard = new RootCircuit({
    platform: { localCacheEngine, enablePartOrientationAnalysis: false },
  })
  redBoard.add(
    <board partsEngine={partsEngine} width="20mm" height="10mm" routingDisabled>
      <resistor name="R1" resistance="10k" footprint="0603" pcbX={-4} />
      <led name="D1" color="red" footprint="0603" pcbX={4} />
    </board>,
  )
  await redBoard.renderUntilSettled()

  const redBoardParts = Object.fromEntries(
    redBoard.db.source_component
      .list()
      .map((component) => [
        component.name,
        component.supplier_part_numbers?.jlcpcb?.[0],
      ]),
  )
  expect(redBoardParts).toEqual({
    R1: "C25804",
    D1: "C3030991",
  })
  expect(calls).toHaveLength(2)

  // R2 has a different name but identical specs to R1, so it reuses R1's cache entry,
  // while D1 has the same name as before but color="blue", so it misses the cache.
  const blueBoard = new RootCircuit({
    platform: { localCacheEngine, enablePartOrientationAnalysis: false },
  })
  blueBoard.add(
    <board partsEngine={partsEngine} width="20mm" height="10mm" routingDisabled>
      <resistor name="R2" resistance="10k" footprint="0603" pcbX={-4} />
      <led name="D1" color="blue" footprint="0603" pcbX={4} />
    </board>,
  )
  await blueBoard.renderUntilSettled()

  const blueBoardParts = Object.fromEntries(
    blueBoard.db.source_component
      .list()
      .map((component) => [
        component.name,
        component.supplier_part_numbers?.jlcpcb?.[0],
      ]),
  )
  expect(blueBoardParts).toEqual({
    R2: "C25804",
    D1: "C5197644",
  })
  expect(calls).toHaveLength(3)
})
