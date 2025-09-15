import { afterAll } from "bun:test";
import { RootCircuit } from "lib/RootCircuit";
import { logSoup } from "@tscircuit/log-soup";
import "lib/register-catalogue";
import "./extend-expect-circuit-snapshot";
import { preventExternalApiRequests } from "./prevent-external-api-requests";
import { getTestStaticAssetsServer } from "./get-test-static-assets-server";
import type { PlatformConfig } from "@tscircuit/props";

export const getTestFixture = ({
  platform,
  withStaticAssetsServer = false,
}: {
  platform?: PlatformConfig;
  withStaticAssetsServer?: boolean;
} = {}) => {
  global.debugGraphics = [];
  preventExternalApiRequests();
  const circuit = new RootCircuit({ platform });
  const staticAssetsServerUrl = withStaticAssetsServer
    ? getTestStaticAssetsServer().url
    : undefined;

  const debugOutputArray: Array<{ name: string; obj: any }> = [];

  // Set up event listener for debug outputs
  circuit.on("debug:logOutput", (event) => {
    debugOutputArray.push({ name: event.name, obj: event.content });
  });

  afterAll(() => {
    if (debugOutputArray.length > 0) {
      for (const { name, obj } of debugOutputArray) {
        const fileName = `debug-output/${name}.json`;
        console.log(`Writing debug output to ${fileName}`);
        Bun.write(
          fileName,
          typeof obj === "string" ? obj : JSON.stringify(obj, null, 2),
        );
      }
    }
  });

  return {
    circuit,
    /**
     * @deprecated use `circuit` instead
     */
    project: circuit,
    logSoup: async (nameOfTest: string) => {
      if (process.env.CI) return;
      if (!circuit.firstChild?.renderPhaseStates.SourceRender.initialized) {
        circuit.render();
      }
      await logSoup(`core_${nameOfTest}`, circuit.getCircuitJson());
    },
    staticAssetsServerUrl,
  };
};
