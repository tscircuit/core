import { Circuit } from "lib/Circuit"
import { logSoup } from "@tscircuit/log-soup"
import "lib/register-catalogue"
import "./extend-expect-circuit-snapshot"

export const getTestFixture = () => {
  const circuit = new Circuit()

  return {
    circuit,
    project: circuit,
    logSoup: async (nameOfTest: string) => {
      if (process.env.CI) return
      if (!circuit.firstChild?.renderPhaseStates.SourceRender.initialized) {
        circuit.render()
      }
      await logSoup(`core_${nameOfTest}`, circuit.getSoup())
    },
  }
}
