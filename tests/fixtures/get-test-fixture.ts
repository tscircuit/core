import { RootCircuit } from "lib/RootCircuit"
import { logSoup } from "@tscircuit/log-soup"
import "lib/register-catalogue"
import "./extend-expect-circuit-snapshot"
import type { PlatformConfig } from "@tscircuit/props"

export const getTestFixture = ({
  platform,
}: { platform?: PlatformConfig } = {}) => {
  global.debugGraphics = []
  const circuit = new RootCircuit({ platform })

  return {
    circuit,
    /**
     * @deprecated use `circuit` instead
     */
    project: circuit,
    logSoup: async (nameOfTest: string) => {
      if (process.env.CI) return
      if (!circuit.firstChild?.renderPhaseStates.SourceRender.initialized) {
        circuit.render()
      }
      await logSoup(`core_${nameOfTest}`, circuit.getCircuitJson())
    },
  }
}
