import { afterAll } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { logSoup } from "@tscircuit/log-soup"
import "lib/register-catalogue"
import "./extend-expect-circuit-snapshot"
import { preventExternalApiRequests } from "./prevent-external-api-requests"
import type { PlatformConfig } from "@tscircuit/props"

declare global {
  var debugOutputs:
    | {
        add: (name: string, value: any) => void
      }
    | undefined
}

export const getTestFixture = ({
  platform,
}: { platform?: PlatformConfig } = {}) => {
  global.debugGraphics = []
  preventExternalApiRequests()
  const circuit = new RootCircuit({ platform })

  const debugOutputArray: Array<{ name: string; obj: any }> = []
  globalThis.debugOutputs = {
    add: (name, obj) => {
      debugOutputArray.push({ name, obj })
    },
  }

  afterAll(() => {
    globalThis.debugOutputs = undefined
    if (debugOutputArray.length > 0) {
      for (const { name, obj } of debugOutputArray) {
        const fileName = `debug-output/${name}.json`
        console.log(`Writing debug output to ${fileName}`)
        Bun.write(
          fileName,
          typeof obj === "string" ? obj : JSON.stringify(obj, null, 2),
        )
      }
    }
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
  }
}
