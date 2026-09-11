import { expect, test } from "bun:test"
import {
  getAutorouterSolverName,
  type AutorouterOptions,
} from "lib/utils/autorouting/CapacityMeshAutorouter"

test("cloud routing selects Pipeline9 only for eligible pipeline and effort choices", () => {
  const cloud = { platformConfig: { useCloudAutorouter: true } }
  for (const autorouterVersion of [
    undefined,
    "latest",
    "beta_pipeline9",
  ] as const) {
    expect(getAutorouterSolverName({ ...cloud, autorouterVersion })).toBe(
      "AutoroutingPipelineSolver9_Networked",
    )
    for (const effort of [0.5, 2]) {
      expect(
        getAutorouterSolverName({ ...cloud, autorouterVersion, effort }),
      ).toBe("AutoroutingPipelineSolver9_PreloadedTraceGraph")
    }
    for (const useCloudAutorouter of [false, undefined]) {
      expect(
        getAutorouterSolverName({
          platformConfig: { useCloudAutorouter },
          autorouterVersion,
        }),
      ).toBe("AutoroutingPipelineSolver9_PreloadedTraceGraph")
    }
  }
  for (const options of [
    { autorouterVersion: "beta_pipeline7" },
    { autorouterVersion: "beta_pipeline5" },
    { useAssignableSolver: true },
    { useAutoJumperSolver: true },
    { useLaserPrefabSolver: true },
    { useTraceSimplificationSolver: true },
  ] satisfies AutorouterOptions[]) {
    expect(getAutorouterSolverName({ ...cloud, ...options })).toBe(
      getAutorouterSolverName(options),
    )
  }
})
