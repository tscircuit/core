import { spyOn } from "bun:test"
import type { FootprintLibraryResult } from "@tscircuit/props"
import { Circuit, type RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import footprintJson from "tests/fixtures/assets/external-0402-footprint.json"

export const convergenceSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M1 1L9 1L9 9L1 9Z" fill="black" /></svg>'

export const convergenceDeferred = <A,>() => Promise.withResolvers<A>()

/** Baseline circuits have no disposer; the rewrite must also finish teardown. */
export async function disposeConvergenceCircuit(circuit: RootCircuit) {
  if (typeof circuit.dispose === "function") await circuit.dispose()
}

/** A noncooperative external fetch lets each version decide cancellation. */
export async function renderGraphicConvergence({
  graphic,
  changeAncestor,
}: {
  graphic: "silkscreen" | "schematic"
  changeAncestor: boolean
}) {
  const response = convergenceDeferred<Response>()
  const requested = convergenceDeferred<void>()
  let fetchCalls = 0
  const fetchDouble: typeof fetch = Object.assign(
    () => {
      fetchCalls++
      requested.resolve()
      return response.promise
    },
    { preconnect: fetch.preconnect },
  )
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(fetchDouble)
  const circuit = new Circuit({
    platform: {
      routingDisabled: true,
      drcChecksDisabled: true,
      ...(graphic === "silkscreen" ? { schematicDisabled: true } : {}),
    },
  })
  let settling: Promise<void> | undefined
  const releaseResponse = () =>
    response.resolve(
      new Response(convergenceSvg, {
        headers: { "content-type": "image/svg+xml" },
      }),
    )
  try {
    circuit.add(
      <board width={changeAncestor ? 10 : 12} height={10}>
        {graphic === "silkscreen" ? (
          <silkscreengraphic
            imageUrl="https://convergence.test/graphic.svg"
            width={2}
            height={2}
            pcbX={1}
          />
        ) : (
          <schematicgraphic
            imageUrl="https://convergence.test/graphic.svg"
            width={2}
            height={2}
          />
        )}
      </board>,
    )
    settling = circuit.renderUntilSettled()
    void settling.catch(() => {})
    await requested.promise
    if (changeAncestor) {
      const board = circuit._getBoard()!
      board.setProps({ ...board.props, width: 12 })
    }
    releaseResponse()
    await settling
    const output = circuit.getCircuitJson().filter((element) =>
      graphic === "silkscreen"
        ? element.type === "pcb_silkscreen_graphic" ||
          element.type === "pcb_silkscreen_path"
        : element.type === "schematic_graphic",
    )
    return { output, fetchCalls }
  } finally {
    releaseResponse()
    await settling?.catch(() => {})
    try {
      await disposeConvergenceCircuit(circuit)
    } finally {
      fetchSpy.mockRestore()
    }
  }
}

export async function renderIsolatedConvergence({
  change,
  consumers = 1,
}: {
  change: "ancestor" | "own" | "none"
  consumers?: 1 | 2
}) {
  const footprint = convergenceDeferred<FootprintLibraryResult>()
  const requested = convergenceDeferred<void>()
  let resolverCalls = 0
  const circuit = new Circuit({
    platform: {
      schematicDisabled: true,
      routingDisabled: true,
      drcChecksDisabled: true,
      footprintLibraryMap: {
        convergence: () => {
          resolverCalls++
          requested.resolve()
          return footprint.promise
        },
      },
    },
  })
  let settling: Promise<void> | undefined
  try {
    circuit.add(
      <board width={change === "ancestor" ? 12 : 16} height={10}>
        <subcircuit
          name="S1"
          _subcircuitCachingEnabled
          pcbX={change === "own" ? 0 : 2}
        >
          <resistor
            name="R1"
            resistance="1k"
            footprint="convergence:0402"
          />
        </subcircuit>
        {consumers === 2 ? (
          <subcircuit name="S2" _subcircuitCachingEnabled pcbX={5}>
            <resistor
              name="R1"
              resistance="1k"
              footprint="convergence:0402"
            />
          </subcircuit>
        ) : null}
      </board>,
    )
    settling = circuit.renderUntilSettled()
    void settling.catch(() => {})
    await requested.promise
    if (change === "ancestor") {
      const board = circuit._getBoard()!
      board.setProps({ ...board.props, width: 16 })
    } else if (change === "own") {
      const subcircuit = circuit
        ._getBoard()!
        .children.find((child) => child.props.name === "S1")!
      subcircuit.setProps({ ...subcircuit.props, pcbX: 2 })
    }
    footprint.resolve({ footprintCircuitJson: footprintJson })
    await settling
    const output = circuit.getCircuitJson().filter(
      (element) =>
        element.type === "source_component" ||
        element.type === "pcb_component" ||
        element.type === "pcb_smtpad",
    )
    return { output, resolverCalls }
  } finally {
    footprint.resolve({ footprintCircuitJson: footprintJson })
    await settling?.catch(() => {})
    await disposeConvergenceCircuit(circuit)
  }
}
