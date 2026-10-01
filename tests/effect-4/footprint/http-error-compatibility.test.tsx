import { expect, spyOn, test } from "bun:test"
import { createFootprintCircuit } from "./helpers"

test("HTTP 404 is never retried and preserves legacy error JSON and end-event policy", async () => {
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(async () => new Response("not found", { status: 404 }), {
      preconnect: globalThis.fetch.preconnect,
    }),
  )
  const log = spyOn(console, "error").mockImplementation(() => {})
  try {
    const legacy = createFootprintCircuit()
    const owned = createFootprintCircuit({ maxRetries: 2 })
    const errors: unknown[][] = [[], []]
    for (const [index, circuit] of [legacy, owned].entries()) {
      circuit.on("asyncEffect:end", (event) => {
        if (event.effectName === "load-footprint-url") {
          errors[index].push(event.error)
        }
      })
      await circuit.renderUntilSettled()
      expect(circuit.isDoneRendering()).toBe(true)
    }
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(errors).toEqual([
      ["Error: Failed to fetch footprint: 404"],
      ["Error: Failed to fetch footprint: 404"],
    ])
    // Error IDs are random and display names contain process-global render IDs.
    // Compare every stable field and independently check the exact message.
    const stableErrors = [legacy, owned].map((circuit) => {
      const { external_footprint_load_error_id, message, ...error } =
        circuit.db.external_footprint_load_error.list()[0]
      expect(message).toBe(
        `${circuit.selectOne("resistor")!.getString()} failed to load external footprint "https://footprint.test/R_0402.json": Failed to fetch footprint: 404`,
      )
      return error
    })
    expect(stableErrors[1]).toEqual(stableErrors[0])
    expect(
      owned
        .getCircuitJson()
        .filter((entry) => entry.type !== "external_footprint_load_error"),
    ).toEqual(
      legacy
        .getCircuitJson()
        .filter((entry) => entry.type !== "external_footprint_load_error"),
    )
    expect(owned.db.external_footprint_load_error.list()).toHaveLength(1)
    expect(owned.experimentalFootprintLoader!.activeJobCount).toBe(0)
    expect(log).toHaveBeenCalledTimes(2)
  } finally {
    log.mockRestore()
    fetchSpy.mockRestore()
  }
})
