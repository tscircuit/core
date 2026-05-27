import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unnamed subcircuit connectivity map keys are deterministic across renders", async () => {
  const sortEntries = <T extends Record<string, unknown>>(entries: T[]) =>
    entries.toSorted((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b)),
    )

  const countByKey = (keys: Array<string | null | undefined>) =>
    Object.fromEntries(
      Object.entries(
        keys.reduce<Record<string, number>>((counts, key) => {
          if (!key) return counts
          counts[key] = (counts[key] ?? 0) + 1
          return counts
        }, {}),
      ).sort(([a], [b]) => a.localeCompare(b)),
    )

  const renderCircuit = async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board>
        <group subcircuit>
          <resistor
            name="R1"
            resistance="10k"
            footprint="0402"
            pcbX={-2}
            pcbY={0}
          />
          <resistor
            name="R2"
            resistance="10k"
            footprint="0402"
            pcbX={2}
            pcbY={0}
          />
          <net name="VCC" />
          <net name="GND" />
          <trace from=".R1 > .pin1" to="net.VCC" />
          <trace from=".R2 > .pin1" to="net.VCC" />
          <trace from=".R1 > .pin2" to="net.GND" />
          <trace from=".R2 > .pin2" to="net.GND" />
        </group>
        <group subcircuit>
          <resistor
            name="R3"
            resistance="22k"
            footprint="0402"
            pcbX={-2}
            pcbY={4}
          />
          <resistor
            name="R4"
            resistance="22k"
            footprint="0402"
            pcbX={2}
            pcbY={4}
          />
          <net name="SIG" />
          <net name="REF" />
          <trace from=".R3 > .pin1" to="net.SIG" />
          <trace from=".R4 > .pin1" to="net.SIG" />
          <trace from=".R3 > .pin2" to="net.REF" />
          <trace from=".R4 > .pin2" to="net.REF" />
        </group>
      </board>,
    )

    circuit.render()

    const schematicSvg = await circuit.getSvg({ view: "schematic" })
    const schematicKeys = Array.from(
      new Set(
        [
          ...schematicSvg.matchAll(
            /data-subcircuit-connectivity-map-key="([^"]+)"/g,
          ),
        ].map((match) => match[1]),
      ),
    ).sort()

    const netKeys = sortEntries(
      circuit.db.source_net.list().map((net) => ({
        name: net.name,
        key: net.subcircuit_connectivity_map_key,
      })),
    )
    const netKeySet = new Set(netKeys.map((net) => net.key))

    return {
      netKeys,
      traceKeyCounts: countByKey(
        circuit.db.source_trace
          .list()
          .map((trace) => trace.subcircuit_connectivity_map_key),
      ),
      portKeyCounts: countByKey(
        circuit.db.source_port
          .list()
          .filter((port) => netKeySet.has(port.subcircuit_connectivity_map_key))
          .map((port) => port.subcircuit_connectivity_map_key),
      ),
      schematicKeys,
    }
  }

  const firstRender = await renderCircuit()
  const secondRender = await renderCircuit()

  expect(firstRender).toEqual(secondRender)
  expect(firstRender.netKeys.map(({ name }) => name).sort()).toEqual([
    "GND",
    "REF",
    "SIG",
    "VCC",
  ])

  const keys = firstRender.netKeys
    .map(({ key }) => key)
    .filter((key): key is string => typeof key === "string")
  expect(keys).toHaveLength(firstRender.netKeys.length)
  expect(new Set(keys).size).toBe(4)
  expect(keys.every((key) => key.startsWith("unnamedsubcircuit"))).toBe(true)
  expect(keys.every((key) => key.includes("_connectivity_net"))).toBe(true)
  expect(firstRender.schematicKeys).toEqual(keys.toSorted())
  expect(firstRender.traceKeyCounts).toEqual(
    Object.fromEntries(keys.toSorted().map((key) => [key, 2])),
  )
  expect(firstRender.portKeyCounts).toEqual(
    Object.fromEntries(keys.toSorted().map((key) => [key, 2])),
  )
})
