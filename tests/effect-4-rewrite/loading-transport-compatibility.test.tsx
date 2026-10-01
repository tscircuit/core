import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  external0402Footprint,
  withLoadingFetch,
} from "./loading-fixture"

test("raw HTTP footprints and graphics retain global transport and emitted asset records", async () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M 0 0 L 10 0 L 10 10 L 0 10 Z" /></svg>'
  let globalCalls = 0
  let platformCalls = 0
  const transport: typeof fetch = Object.assign(
    async (input: Parameters<typeof fetch>[0]) => {
      globalCalls++
      return String(input).endsWith(".json")
        ? Response.json(external0402Footprint)
        : new Response(svg, { headers: { "content-type": "image/svg+xml" } })
    },
    { preconnect: fetch.preconnect },
  )
  const unrelatedPlatformTransport: typeof fetch = Object.assign(
    async () => {
      platformCalls++
      throw new Error("legacy raw/image paths do not use platformFetch")
    },
    { preconnect: fetch.preconnect },
  )
  await withLoadingFetch(transport, async () => {
    const circuit = createLoadingCircuit({
      platformFetch: unrelatedPlatformTransport,
    })
    circuit.add(
      <board width={10} height={10}>
        <resistor
          name="R1"
          resistance="10k"
          footprint="https://loading.test/part.json"
        />
        <silkscreengraphic
          imageUrl="https://loading.test/pcb.svg"
          width={2}
          height={2}
        />
        <schematicgraphic
          imageUrl="https://loading.test/sch.svg"
          width={2}
          height={2}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(globalCalls).toBe(3)
    expect(platformCalls).toBe(0)
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
    expect(circuit.db.pcb_silkscreen_graphic.list()[0]?.image_asset).toEqual({
      project_relative_path: "https://loading.test/pcb.svg",
      url: "https://loading.test/pcb.svg",
      mimetype: "image/svg+xml",
    })
    expect(circuit.db.schematic_graphic.list()[0]?.svg_content).toBe(svg)
    expect(circuit.effectRuntime.activeJobCount).toBe(0)
    await circuit.dispose()
  })
})
