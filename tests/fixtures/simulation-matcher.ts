import { convertCircuitJsonToSchematicSimulationSvg } from "circuit-to-svg"
import { expect, type MatcherResult } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"
import { RootCircuit } from "lib/RootCircuit"
import type { AnyCircuitElement } from "circuit-json"

async function saveSvgSnapshotOfSimulation({
  circuitJson,
  testPath,
  updateSnapshot,
  forceUpdateSnapshot,
  options,
}: {
  circuitJson: AnyCircuitElement[]
  testPath: string
  updateSnapshot: boolean
  forceUpdateSnapshot: boolean
  options?: any
}): Promise<MatcherResult> {
  testPath = testPath.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath || ""), "__snapshots__")
  const snapshotName = `${path.basename(testPath || "")}-simulation.snap.svg`
  const filePath = path.join(snapshotDir, snapshotName)

  // Find the simulation_experiment_id from the circuit JSON
  const simulationExperiment = circuitJson.find(
    (el) => el.type === "simulation_experiment",
  )
  const simulationExperimentId =
    simulationExperiment?.simulation_experiment_id ?? "default"

  const content = convertCircuitJsonToSchematicSimulationSvg({
    circuitJson: circuitJson,
    simulation_experiment_id: simulationExperimentId,
    ...options,
  })

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  if (!fs.existsSync(filePath) || forceUpdateSnapshot) {
    console.log("Creating simulation snapshot at", filePath)
    fs.writeFileSync(filePath, content)
    return {
      message: () => `Simulation snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath)
  const currentBuffer = Buffer.from(content)

  const result = await looksSame(currentBuffer, existingSnapshot, {
    strict: false,
    tolerance: 2,
  })

  if (result.equal) {
    return {
      message: () => "Simulation snapshot matches",
      pass: true,
    }
  }

  if (!result.equal && updateSnapshot) {
    console.log("Updating simulation snapshot at", filePath)
    fs.writeFileSync(filePath, content)
    return {
      message: () => `Simulation snapshot updated at ${filePath}`,
      pass: true,
    }
  }

  const diffPath = filePath.replace(".snap.svg", ".diff.png")
  await looksSame.createDiff({
    reference: existingSnapshot,
    current: currentBuffer,
    diff: diffPath,
    highlightColor: "#ff00ff",
  })

  return {
    message: () =>
      `Simulation snapshot does not match. Diff saved at ${diffPath}`,
    pass: false,
  }
}

expect.extend({
  async toMatchSimulationSnapshot(
    this: any,
    received: unknown,
    ...args: any[]
  ): Promise<MatcherResult> {
    let circuitJson: AnyCircuitElement[]
    if (received instanceof RootCircuit) {
      await received.renderUntilSettled()
      circuitJson = await received.getCircuitJson()
    } else {
      circuitJson = received as AnyCircuitElement[]
    }

    return saveSvgSnapshotOfSimulation({
      circuitJson: circuitJson,
      testPath: args[0],
      updateSnapshot:
        process.argv.includes("--update-snapshots") ||
        process.argv.includes("-u") ||
        Boolean(process.env.BUN_UPDATE_SNAPSHOTS),
      forceUpdateSnapshot:
        process.argv.includes("--force-update-snapshots") ||
        process.argv.includes("-f") ||
        Boolean(process.env.BUN_FORCE_UPDATE_SNAPSHOTS),
      options: args[1],
    })
  },
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchSimulationSnapshot(
      testPath: string,
      options?: any,
    ): Promise<MatcherResult>
  }
}
