import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "./helpers"

test("removal cancels a real local HTTP fetch while its response body is still streaming", async () => {
  let responseStarted!: () => void
  let responseClosed!: () => void
  const started = new Promise<void>((resolve) => {
    responseStarted = resolve
  })
  const closed = new Promise<void>((resolve) => {
    responseClosed = resolve
  })
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("["))
            responseStarted()
          },
          cancel() {
            responseClosed()
          },
        }),
      ),
  })
  let aborts = 0
  const circuit = new RootCircuit({
    platform: { routingDisabled: true },
    experimentalFootprintLoading: {
      fetch: (url, options) => {
        options.signal!.addEventListener("abort", () => aborts++, {
          once: true,
        })
        return fetch(url, options)
      },
    },
  })
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint={`${server.url}footprint`}
      />
    </board>,
  )
  let closeDeadline: ReturnType<typeof setTimeout> | undefined
  try {
    const settled = circuit.renderUntilSettled()
    await started
    // Headers/body have reached the client before removal. This specifically
    // exercises response.json(), rather than only cancelling before fetch.
    await new Promise((resolve) => setTimeout(resolve, 10))
    const resistor = circuit.selectOne("resistor")!
    resistor.parent!.remove(resistor)
    await settled
    await Promise.race([
      closed,
      new Promise<void>((_, reject) => {
        closeDeadline = setTimeout(
          () => reject(new Error("HTTP stream did not close after abort")),
          1000,
        )
      }),
    ])
    expect(aborts).toBe(1)
    expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
    expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
    expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  } finally {
    clearTimeout(closeDeadline)
    await circuit.experimentalFootprintLoader!.dispose()
    await server.stop(true)
  }
})
