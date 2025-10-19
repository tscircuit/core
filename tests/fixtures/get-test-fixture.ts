import { afterAll } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { logSoup } from "@tscircuit/log-soup"
import "lib/register-catalogue"
import "./extend-expect-circuit-snapshot"
import "./extend-expect-3d-matcher"
import { preventExternalApiRequests } from "./prevent-external-api-requests"
import { getTestStaticAssetsServer } from "./get-test-static-assets-server"
import type { PlatformConfig } from "@tscircuit/props"

export const getTestFixture = ({
  platform,
  withStaticAssetsServer = false,
}: {
  platform?: PlatformConfig
  withStaticAssetsServer?: boolean
} = {}) => {
  global.debugGraphics = []
  preventExternalApiRequests()
  const circuit = new RootCircuit({ platform })
  const staticAssetsServerUrl = withStaticAssetsServer
    ? getTestStaticAssetsServer().url
    : undefined

  // Set up event listener for debug outputs
  circuit.on("debug:logOutput", (event) => {
    global.debugOutputArray?.push({ name: event.name, obj: event.content })
  })

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
    staticAssetsServerUrl,
  }
}
