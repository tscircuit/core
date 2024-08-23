import { Project } from "lib/Project"
import { logSoup } from "@tscircuit/log-soup"
import "lib/register-catalogue"
import "./extend-expect-circuit-snapshot"

export const getTestFixture = () => {
  const project = new Project()

  return {
    project,
    logSoup: async (lgn: string) => {
      if (!project.rootComponent?.renderPhaseStates.SourceRender.initialized) {
        project.render()
      }
      const result = await logSoup(`core: ${lgn}`, project.getSoup())

      console.log(result)
    },
  }
}
