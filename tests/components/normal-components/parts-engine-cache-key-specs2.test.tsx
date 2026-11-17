import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { RootCircuit } from "lib/RootCircuit"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import "lib/register-catalogue"

test("parts engine cache key includes inductance, max resistance and crystal frequency", async () => {
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
      const value = sc.inductance ?? sc.max_resistance ?? sc.frequency
      lookups.push(`${sc.ftype}:${value}`)
      return { jlcpcb: [`${sc.ftype}:${value}`] }
    },
  }

  const build = async (props: {
    inductance: string
    maxResistance: string
    frequency: string
  }) => {
    const circuit = new RootCircuit({
      platform: { localCacheEngine, enablePartOrientationAnalysis: false },
    })
    circuit.add(
      <board
        partsEngine={partsEngine}
        width="20mm"
        height="10mm"
        routingDisabled
      >
        <inductor
          name="L1"
          inductance={props.inductance}
          footprint="0603"
          pcbX={-5}
        />
        <potentiometer
          name="RV1"
          maxResistance={props.maxResistance}
          footprint="0603"
          pcbX={0}
        />
        <crystal
          name="Y1"
          frequency={props.frequency}
          loadCapacitance="18pF"
          footprint="0603"
          pcbX={5}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    return Object.fromEntries(
      circuit.db.source_component
        .list()
        .map((c) => [c.name, c.supplier_part_numbers?.jlcpcb?.[0]]),
    )
  }

  const original = {
    inductance: "10uH",
    maxResistance: "10k",
    frequency: "16MHz",
  }
  const edited = { inductance: "1uH", maxResistance: "1k", frequency: "8MHz" }

  await build(original)
  await build(original)
  expect(lookups).toHaveLength(3)

  expect(await build(edited)).toEqual({
    L1: "simple_inductor:1uH",
    RV1: "simple_potentiometer:1000",
    Y1: "simple_crystal:8000000",
  })
  expect(lookups).toHaveLength(6)

  await build(edited)
  expect(lookups).toHaveLength(6)
})
