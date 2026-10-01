import { expect, test } from "bun:test"
import { ZodError } from "zod"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  external0402Footprint,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("a rejected partial props update preserves the pending footprint and baseline raw-props replacement", async () => {
  const footprint = loadingRevisionDeferred<{
    footprintCircuitJson: typeof external0402Footprint
  }>()
  let resolverCalls = 0
  const events: string[] = []
  const circuit = createLoadingRevisionCircuit({
    drcChecksDisabled: true,
    footprintLibraryMap: {
      kicad: () => {
        resolverCalls++
        return footprint.promise
      },
    },
  })
  let settled: Promise<void> | undefined
  try {
    circuit.on("asyncEffect:start", (event) => {
      if (event.effectName === "load-lib-footprint") events.push("start")
    })
    circuit.on("asyncEffect:end", (event) => {
      if (event.effectName === "load-lib-footprint") events.push("end")
    })
    circuit.add(
      <board width={10} height={10}>
        <resistor name="R1" resistance="10k" footprint="kicad:partial" />
      </board>,
    )
    settled = circuit.renderUntilSettled()
    const resistor = circuit.selectOne(".R1")!
    const previousRawProps = resistor.props
    const previousParsedProps = resistor._parsedProps
    const previousParsedValues = { ...previousParsedProps }
    const partial = { pcbX: 2 }
    const expectedRawProps = resistor.config.zodProps.parse({
      ...previousRawProps,
      ...partial,
    })
    const expectedPartial = resistor.config.zodProps.safeParse(partial)
    if (expectedPartial.success)
      throw new Error(
        "Fixture requires the partial input to omit required props",
      )

    let thrown: unknown
    try {
      resistor.setProps(partial)
    } catch (error) {
      thrown = error
    }
    const beforeRelease = {
      rawProps: { ...resistor.props },
      parsedProps: { ...resistor._parsedProps },
      resolverCalls,
      events: [...events],
    }
    await flushLoadingRevisionMicrotasks()
    footprint.resolve({ footprintCircuitJson: external0402Footprint })
    await settled
    const json = circuit.getCircuitJson()
    const pads = json.filter((element) => element.type === "pcb_smtpad")
    const diagnostics = json.filter(
      (element) => element.type === "external_footprint_load_error",
    )
    const issues = thrown instanceof ZodError ? thrown.issues : null
    reportLoadingRevisionObservation("S3", "rejected_partial_footprint", {
      beforeRelease,
      issues,
      rawProps: resistor.props,
      parsedProps: resistor._parsedProps,
      resolverCalls,
      events,
      pads,
      diagnostics,
      json,
    })

    expect(thrown).toBeInstanceOf(ZodError)
    expect(JSON.parse(JSON.stringify(issues))).toEqual(
      JSON.parse(JSON.stringify(expectedPartial.error.issues)),
    )
    // The baseline replaces merged raw props before its partial parse throws.
    expect(resistor.props).not.toBe(previousRawProps)
    expect(resistor.props).toEqual(expectedRawProps)
    expect(resistor._parsedProps).toBe(previousParsedProps)
    expect(resistor._parsedProps).toEqual(previousParsedValues)
    expect(resolverCalls).toBe(1)
    expect(events).toEqual(["start", "end"])
    expect(pads).toHaveLength(2)
    expect(diagnostics).toHaveLength(0)
  } finally {
    footprint.resolve({ footprintCircuitJson: external0402Footprint })
    await settled
    await disposeLoadingRevisionCircuit(circuit)
  }
})
