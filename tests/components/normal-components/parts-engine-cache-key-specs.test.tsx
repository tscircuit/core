import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { RootCircuit } from "lib/RootCircuit"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import "lib/register-catalogue"

// Mirrors the reproduction in https://github.com/tscircuit/core/issues/5566
const PART_BY_VALUE: Record<string, string> = {
  "simple_resistor:10000": "C25804",
  "simple_resistor:1000": "C21190",
  "simple_capacitor:1e-7": "C14663",
  "simple_capacitor:0.00001": "C19702",
  "simple_led:red": "C3030991",
  "simple_led:blue": "C5197644",
}

const Board = (props: {
  resistance: string
  capacitance: string
  color: string
  partsEngine: PartsEngine
}) => (
  <board
    partsEngine={props.partsEngine}
    width="12mm"
    height="8mm"
    routingDisabled
  >
    <resistor
      name="R1"
      resistance={props.resistance}
      footprint="0603"
      pcbX={-3}
    />
    <capacitor
      name="C1"
      capacitance={props.capacitance}
      footprint="0603"
      pcbX={0}
    />
    <led name="D1" color={props.color} footprint="0603" pcbX={3} />
  </board>
)

test("parts engine cache key includes resistance, capacitance and LED color", async () => {
  const store = new Map<string, string>()
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
  }

  const lookups: string[] = []
  const partsEngine: PartsEngine = {
    findPart: async ({ sourceComponent }) => {
      const sc = sourceComponent as any
      const value = sc.resistance ?? sc.capacitance ?? sc.color
      const lookup = `${sc.ftype}:${value}`
      lookups.push(lookup)
      return { jlcpcb: [PART_BY_VALUE[lookup] ?? "unknown"] }
    },
  }

  const build = async (props: {
    resistance: string
    capacitance: string
    color: string
  }) => {
    const circuit = new RootCircuit({
      platform: { localCacheEngine, enablePartOrientationAnalysis: false },
    })
    circuit.add(<Board {...props} partsEngine={partsEngine} />)
    await circuit.renderUntilSettled()
    return Object.fromEntries(
      circuit.db.source_component
        .list()
        .map((c) => [c.name, c.supplier_part_numbers?.jlcpcb?.[0]]),
    )
  }

  const original = { resistance: "10k", capacitance: "100nF", color: "red" }
  const edited = { resistance: "1k", capacitance: "10uF", color: "blue" }

  // Build 1: cold cache, every component is looked up
  expect(await build(original)).toEqual({
    R1: "C25804",
    C1: "C14663",
    D1: "C3030991",
  })
  expect(lookups).toHaveLength(3)

  // Build 2: identical request is served from the cache
  expect(await build(original)).toEqual({
    R1: "C25804",
    C1: "C14663",
    D1: "C3030991",
  })
  expect(lookups).toHaveLength(3)

  // Build 3: edited values must trigger fresh lookups (previously stale)
  expect(await build(edited)).toEqual({
    R1: "C21190",
    C1: "C19702",
    D1: "C5197644",
  })
  expect(lookups.slice(3).sort()).toEqual([
    "simple_capacitor:0.00001",
    "simple_led:blue",
    "simple_resistor:1000",
  ])

  // Build 4: repeating the edited request is cached again
  expect(await build(edited)).toEqual({
    R1: "C21190",
    C1: "C19702",
    D1: "C5197644",
  })
  expect(lookups).toHaveLength(6)
})
