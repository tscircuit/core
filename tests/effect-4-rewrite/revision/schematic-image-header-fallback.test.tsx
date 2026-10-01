import { expect, spyOn, test } from "bun:test"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("S6 remote header failures retain the public schematic SVG fallback", async () => {
  const imageUrl = "https://fixture.invalid/header-fallback.svg"
  const svgContent =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><path d="M0 0 L2 0 L2 2 Z"/></svg>'
  const failure = new Error("controlled image header failure")
  const fetchStarted = loadingRevisionDeferred<void>()
  const fetchedResponse = loadingRevisionDeferred<Response>()
  const response = new Response(null, {
    headers: { "content-type": "image/svg+xml" },
  })
  let fetchCalls = 0
  let headerReads = 0
  const events: string[] = []
  const endErrors: string[] = []
  // A real, bodyless Response isolates the public header-read failure from
  // stream reading, stream cancellation, and cleanup failures.
  Object.defineProperty(response.headers, "get", {
    value: () => {
      headerReads++
      throw failure
    },
  })
  const controlledFetch: typeof fetch = Object.assign(
    () => {
      fetchCalls++
      fetchStarted.resolve()
      return fetchedResponse.promise
    },
    { preconnect: fetch.preconnect },
  )
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    controlledFetch,
  )
  const circuit = createLoadingRevisionCircuit({ drcChecksDisabled: true })
  circuit.on("asyncEffect:start", (event: { effectName: string }) => {
    if (event.effectName === "SchematicGraphicRender") events.push("start")
  })
  circuit.on(
    "asyncEffect:end",
    (event: { effectName: string; error?: string }) => {
      if (event.effectName !== "SchematicGraphicRender") return
      events.push("end")
      if (event.error !== undefined) endErrors.push(event.error)
    },
  )
  try {
    circuit.add(
      <board width={10} height={10}>
        <schematicgraphic
          imageUrl={imageUrl}
          svgContent={svgContent}
          width={2}
          height={2}
        />
      </board>,
    )
    const settled = circuit.renderUntilSettled()
    await fetchStarted.promise
    fetchedResponse.resolve(response)
    await settled
    const json = structuredClone(circuit.getCircuitJson())
    const graphics = json.filter(
      (element) => element.type === "schematic_graphic",
    )
    const diagnostics = json.filter(
      (element) =>
        element.type.endsWith("_error") || element.type.endsWith("_warning"),
    )
    await disposeLoadingRevisionCircuit(circuit)
    await flushLoadingRevisionMicrotasks()
    const afterDisposeJson = circuit.getCircuitJson()
    reportLoadingRevisionObservation("S6", "remote_header_fallback", {
      graphics,
      diagnostics,
      fetchCalls,
      headerReads,
      events,
      endErrors,
      outputRetainedAfterDispose:
        JSON.stringify(afterDisposeJson) === JSON.stringify(json),
    })

    expect(response.body).toBeNull()
    expect(fetchCalls).toBe(1)
    expect(headerReads).toBe(1)
    expect(events).toEqual(["start", "end"])
    expect(endErrors).toEqual([])
    expect(diagnostics).toEqual([])
    expect(graphics).toHaveLength(1)
    expect(graphics[0]!.asset).toEqual({
      project_relative_path: imageUrl,
      url: imageUrl,
      mimetype: "image/svg+xml",
    })
    expect(graphics[0]!.svg_content).toBe(svgContent)
    expect(graphics[0]!.width).toBe(2)
    expect(graphics[0]!.height).toBe(2)
    expect(afterDisposeJson).toEqual(json)
  } finally {
    fetchedResponse.resolve(response)
    await disposeLoadingRevisionCircuit(circuit)
    fetchSpy.mockRestore()
  }
})
