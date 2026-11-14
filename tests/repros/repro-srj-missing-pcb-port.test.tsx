import { expect, spyOn, test } from "bun:test"
import type { RootCircuit } from "lib/RootCircuit"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import DebugBoard from "tests/projects/rp2040/DEBUG.circuit"

const getPcbPortCount = (circuit: RootCircuit, componentName: string) => {
  const sourceComponent = circuit.db.source_component.getWhere({
    name: componentName,
  })
  if (!sourceComponent) return 0

  const sourcePortIds = new Set(
    circuit.db.source_port
      .list({ source_component_id: sourceComponent.source_component_id })
      .map((sourcePort) => sourcePort.source_port_id),
  )

  return circuit.db.pcb_port
    .list()
    .filter((pcbPort) => sourcePortIds.has(pcbPort.source_port_id)).length
}

test.failing(
  "rp2040 debug circuit does not crash autorouting when a trace connects components without PCB ports",
  async () => {
    const consoleError = spyOn(console, "error")

    try {
      const { circuit } = getTestFixture()
      circuit.add(<DebugBoard />)
      await circuit.renderUntilSettled()

      const connectedPortCrash = consoleError.mock.calls.find((args) =>
        args.some((arg) => String(arg).includes("connectedPort.x")),
      )
      expect(connectedPortCrash).toBeUndefined()

      expect(getPcbPortCount(circuit, "TP6")).toBe(1)
      expect(getPcbPortCount(circuit, "SW2")).toBe(0)
    } finally {
      consoleError.mockRestore()
    }
  },
  30_000,
)
