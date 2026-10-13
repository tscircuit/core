import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual via policy aggregates per path and respects board opt-in", async () => {
  for (const allowBlindAndBuriedVias of [undefined, false, true]) {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true
    circuit.add(
      <board
        width={18}
        height={12}
        layers={4}
        routeRemaining={false}
        allowBlindAndBuriedVias={allowBlindAndBuriedVias}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
        <trace
          name="SAVED"
          path={["R1.pin2"]}
          pcbPathRelativeTo="R1.pin2"
          pcbPaths={[
            [
              "R1.pin2",
              { x: 2, y: 2 },
              { x: 2, y: 2, via: true, fromLayer: "top", toLayer: "bottom" },
              { x: 2, y: 2 },
              { x: 4, y: 2 },
              { x: 4, y: 2, via: true, fromLayer: "bottom", toLayer: "inner2" },
              { x: 4, y: 2 },
              { x: 6, y: 2 },
              { x: 6, y: 2, via: true, fromLayer: "inner2", toLayer: "inner1" },
              { x: 6, y: 2 },
              { x: 8, y: 2 },
            ],
            [
              "R1.pin2",
              { x: 4, y: -2 },
              { x: 4, y: -2, via: true, toLayer: "inner1" },
              { x: 4, y: -2 },
              { x: 8, y: -2 },
            ],
            [
              "R1.pin2",
              { x: 4, y: 0 },
              { x: 4, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
              { x: 4, y: 0 },
              { x: 8, y: 0 },
            ],
          ]}
        />
        <pcbnotetext
          text="PATH 0: BLIND + BURIED = ONE ERROR"
          pcbY={4}
          fontSize={0.45}
        />
        <pcbnotetext
          text="PATH 1: BLIND = ONE ERROR / PATH 2: THROUGH = OK"
          pcbY={-4}
          fontSize={0.4}
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const pcbTraces = circuit.db.pcb_trace.list()
    const vias = circuit.db.pcb_via.list()
    expect(pcbTraces).toHaveLength(3)
    expect(vias.map((via) => via.layers)).toEqual([
      ["top", "inner1", "inner2", "bottom"],
      ["bottom", "inner2"],
      ["inner2", "inner1"],
      ["top", "inner1"],
      ["top", "inner1", "inner2", "bottom"],
    ])

    // These open paths also have dangling-end diagnostics; inspect via policy.
    const errors = circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.startsWith("Invalid pcbPaths["))
    if (allowBlindAndBuriedVias) {
      expect(errors).toHaveLength(0)
      continue
    }

    expect(errors).toHaveLength(2)
    for (const [pathIndex, error] of errors.entries()) {
      expect(error.pcb_trace_id).toBe(pcbTraces[pathIndex]!.pcb_trace_id)
      expect(error.is_fatal).toBe(false)
      expect(error.message).toContain(`Invalid pcbPaths[${pathIndex}] (`)
      expect(error.message).toContain("SAVED")
      expect(error.message).toContain("allowBlindAndBuriedVias={false}")
      expect(error.message).toContain('fromLayer: "top", toLayer: "bottom"')
      expect(error.message).toContain("adjusting the adjoining wire layers")
      expect(error.message).toContain(
        "allowBlindAndBuriedVias={true} on <board>",
      )
    }
    expect(errors[0]!.message).toContain("2 disallowed vias")
    expect(errors[0]!.message).toContain("pcbPaths[0][5]: blind via")
    expect(errors[0]!.message).toContain("pcbPaths[0][8]: buried via")
    expect(errors[0]!.message).not.toContain("pcbPaths[0][2]:")
    expect(errors[0]!.message).not.toContain("pcbPaths[1][2]:")
    expect(errors[0]!.center).toEqual({ x: vias[1]!.x, y: vias[1]!.y })
    expect(errors[1]!.message).toContain("1 disallowed via.")
    expect(errors[1]!.message).toContain(
      'pcbPaths[1][2]: blind via (fromLayer: "top", toLayer: "inner1")',
    )
    expect(errors[1]!.center).toEqual({ x: vias[3]!.x, y: vias[3]!.y })

    if (allowBlindAndBuriedVias === false) {
      await expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
