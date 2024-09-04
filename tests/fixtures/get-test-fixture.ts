import { Circuit } from "lib/Project"
import { logSoup } from "@tscircuit/log-soup"
import "lib/register-catalogue"
import "./extend-expect-circuit-snapshot"

export const getTestFixture = () => {
  const project = new Circuit()

  return {
    project,
    circuit: project,
    logSoup: async (nameOfTest: string) => {
      if (process.env.CI) return
      if (!project.firstChild?.renderPhaseStates.SourceRender.initialized) {
        project.render()
      }
      await logSoup(`core_${nameOfTest}`, project.getSoup())
    },
  }
}
