import { expect, spyOn, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a failed net-island solve becomes a readable circuit error", async () => {
  const solveSync = TscircuitAutorouter.prototype.solveSync
  let simulatedFailure = false
  const solverSpy = spyOn(
    TscircuitAutorouter.prototype,
    "solveSync",
  ).mockImplementation(function (this: TscircuitAutorouter) {
    if (
      this.input.connections.some(
        (connection) =>
          connection.name === "__net_trace_tmp" ||
          connection.source_trace_id === "__net_trace_tmp",
      )
    ) {
      simulatedFailure = true
      throw new Error("private_solver_id must not appear in the diagnostic")
    }
    return solveSync.call(this)
  })
  try {
    const { circuit } = getTestFixture({
      platform: { allowLegacyAutorouters: true },
    })
    circuit.add(
      <board width={10} height={10} autorouter="sequential_trace">
        <net name="COM" />
        <resistor name="R1" resistance="10k" pcbX={-3} footprint="0402" />
        <resistor name="R2" resistance="10k" pcbX={3} footprint="0402" />
        <resistor
          name="R3"
          resistance="10k"
          pcbX={3}
          pcbY={2}
          footprint="0402"
        />
        <resistor
          name="R4"
          resistance="10k"
          pcbX={-3}
          pcbY={2}
          footprint="0402"
        />
        <trace from=".R1 > pin.1" to="net.COM" />
        <trace from=".R2 > pin.2" to="net.COM" />
        <trace from=".R3 > pin.1" to="net.COM" />
        <trace from=".R4 > pin.1" to="net.COM" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(simulatedFailure).toBe(true)
    const errors = circuit.db.pcb_trace_error.list()
    expect(
      errors.some(
        (error) =>
          error.message.includes("Failed to route net islands") &&
          error.message.includes("COM"),
      ),
    ).toBe(true)
    expect(
      errors.every((error) => !error.message.includes("private_solver_id")),
    ).toBe(true)
  } finally {
    solverSpy.mockRestore()
  }
})
