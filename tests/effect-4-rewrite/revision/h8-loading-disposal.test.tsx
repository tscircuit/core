import { expect, spyOn, test } from "bun:test"
import type { FootprintLibraryResult } from "@tscircuit/props"
import {
  createLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
} from "./loading-fixtures"

test("H8 disposal completes with an unresolved Normal load and rejects late graphic work", async () => {
  const libraryResult = loadingRevisionDeferred<FootprintLibraryResult>()
  const graphicResponse = loadingRevisionDeferred<Response>()
  const graphicStarted = loadingRevisionDeferred<void>()
  const unhandled: unknown[] = []
  const onUnhandled = (reason: unknown) => {
    unhandled.push(reason)
  }
  let libraryCalls = 0
  let fetchCalls = 0
  let lateHeaderReads = 0
  let closedBodies = 0
  const controlledFetch: typeof fetch = Object.assign(
    () => {
      fetchCalls++
      graphicStarted.resolve()
      return graphicResponse.promise
    },
    { preconnect: fetch.preconnect },
  )
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    controlledFetch,
  )
  process.on("unhandledRejection", onUnhandled)
  const circuit = createLoadingRevisionCircuit({
    footprintLibraryMap: {
      kicad: () => {
        libraryCalls++
        return libraryResult.promise
      },
    },
  })
  try {
    circuit.add(
      <board>
        <resistor name="R1" resistance="10k" footprint="kicad:never" />
        <silkscreengraphic
          imageUrl="https://fixture.invalid/late.svg"
          width={2}
          height={2}
        />
      </board>,
    )
    circuit.render()
    await graphicStarted.promise
    expect(libraryCalls).toBe(1)
    const retainedJson = circuit.getCircuitJson()
    const beforeDispose = structuredClone(retainedJson)
    // libraryResult remains unresolved throughout disposal and this entire test.
    await circuit.dispose()
    const lateResponse = new Response(
      new ReadableStream({
        cancel() {
          closedBodies++
        },
      }),
      { headers: { "content-type": "image/svg+xml" } },
    )
    const headers = lateResponse.headers
    Object.defineProperty(lateResponse, "headers", {
      get() {
        lateHeaderReads++
        return headers
      },
    })
    graphicResponse.resolve(lateResponse)
    await flushLoadingRevisionMicrotasks()
    expect(circuit.getCircuitJson()).toEqual(beforeDispose)
    expect(retainedJson).toEqual(beforeDispose)
    expect(fetchCalls).toBe(1)
    expect(libraryCalls).toBe(1)
    expect(lateHeaderReads).toBe(0)
    expect(closedBodies).toBe(1)
    expect(unhandled).toEqual([])
  } finally {
    await circuit.dispose()
    fetchSpy.mockRestore()
    process.removeListener("unhandledRejection", onUnhandled)
  }
})
