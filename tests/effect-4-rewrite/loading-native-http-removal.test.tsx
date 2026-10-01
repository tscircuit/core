import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  createLoadingFetch,
  flushLoading,
  withLoadingFetch,
} from "./loading-fixture"

test("default HTTP footprint jobs close late responses without decoding or mutating removed owners", async () => {
  const { platformFetch, requests } = createLoadingFetch({ ignoreAbort: true })
  await withLoadingFetch(platformFetch, async () => {
    const circuit = createLoadingCircuit()
    circuit.add(
      <board>
        <resistor
          name="R1"
          resistance="10k"
          footprint="https://loading.test/part.json"
        />
      </board>,
    )
    const settled = circuit.renderUntilSettled()
    const resistor = circuit.selectOne(".R1")!
    const childrenBefore = resistor.children.length
    resistor.parent!.remove(resistor)
    await settled
    expect(requests[0].signal.aborted).toBe(true)
    let closedBodies = 0
    requests[0].resolve(
      new Response(
        new ReadableStream({
          cancel() {
            closedBodies++
          },
        }),
      ),
    )
    await flushLoading()
    expect(closedBodies).toBe(1)
    expect(resistor.children).toHaveLength(childrenBefore)
    expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
    expect(circuit.effectRuntime.activeJobCount).toBe(0)
    await circuit.dispose()
  })
})
