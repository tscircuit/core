import { expect, spyOn, test } from "bun:test"
import { FanoutAutorouter } from "lib/utils/autorouting/FanoutAutorouter"
import type { AutorouterCompleteEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

type SolverBus = {
  busId: string
  exitPosition?: string
}

type FanoutSolverOptions = {
  buses?: readonly SolverBus[]
}

type InspectableFanoutAutorouter = {
  eventHandlers: {
    complete: Array<(event: AutorouterCompleteEvent) => void>
  }
  getFanoutSolverOptions(): FanoutSolverOptions
  outputSimpleRouteJson?: SimpleRouteJson
}

const expectedExitsByDramPosition = {
  right: {
    dram: { DDR_BYTE0: "leftside_center", DDR_BYTE1: "leftside_center" },
    position: { x: 30, y: 0 },
    soc: { DDR_BYTE0: "rightside_top", DDR_BYTE1: "rightside_bottom" },
  },
  top: {
    dram: { DDR_BYTE0: "bottomside_center", DDR_BYTE1: "bottomside_center" },
    position: { x: 0, y: 30 },
    soc: { DDR_BYTE0: "topside_left", DDR_BYTE1: "topside_right" },
  },
  left: {
    dram: { DDR_BYTE0: "rightside_center", DDR_BYTE1: "rightside_center" },
    position: { x: -30, y: 0 },
    soc: { DDR_BYTE0: "leftside_bottom", DDR_BYTE1: "leftside_top" },
  },
  bottom: {
    dram: { DDR_BYTE0: "topside_center", DDR_BYTE1: "topside_center" },
    position: { x: 0, y: -30 },
    soc: { DDR_BYTE0: "bottomside_right", DDR_BYTE1: "bottomside_left" },
  },
} as const

const getDdrBusExitPositions = (
  options: FanoutSolverOptions,
): Record<string, string | undefined> => {
  return Object.fromEntries(
    (options.buses ?? [])
      .filter((bus) => bus.busId === "DDR_BYTE0" || bus.busId === "DDR_BYTE1")
      .map((bus) => [bus.busId, bus.exitPosition]),
  )
}

test("AM62L and LPDDR4 fanout solver exits follow all four relative placements", async () => {
  await expect(
    renderAm62lLpddr4Fanout({
      fanoutAlgorithmFn: async () => {
        throw new Error("custom replay autorouter must not run")
      },
      orientBusFanoutDirectionsTowardOtherComponent: true,
      snapshotPath: import.meta.path,
    }),
  ).rejects.toThrow(
    "fanoutAlgorithmFn bypasses busFanoutDirections; orbit-aware fanout must use the built-in fanout solver",
  )

  let fanoutSolverInputs: Array<Record<string, string | undefined>> = []
  const fanoutStart = spyOn(
    FanoutAutorouter.prototype,
    "start",
  ).mockImplementation(function (this: FanoutAutorouter) {
    const internal = this as unknown as InspectableFanoutAutorouter
    fanoutSolverInputs.push(
      getDdrBusExitPositions(internal.getFanoutSolverOptions()),
    )

    // The assertion is about the exact options produced for FanoutSolver.
    // Complete the built-in autorouter immediately after that seam so four
    // full AM62L/LPDDR4 placements stay a fast unit-level regression.
    internal.outputSimpleRouteJson = this.input
    this.isRouting = true
    setTimeout(() => {
      this.isRouting = false
      for (const complete of internal.eventHandlers.complete) {
        complete({ type: "complete", traces: [] as SimplifiedPcbTrace[] })
      }
    }, 0)
  })

  try {
    for (const [placement, expected] of Object.entries(
      expectedExitsByDramPosition,
    )) {
      fanoutSolverInputs = []

      await renderAm62lLpddr4Fanout({
        layout: {
          boardHeight: "80mm",
          boardWidth: "80mm",
          dramFanoutPadding: "5mm",
          dramPcbX: expected.position.x,
          dramPcbY: expected.position.y,
          socFanoutPadding: "5mm",
          socPcbX: 0,
          socPcbY: 0,
        },
        orientBusFanoutDirectionsTowardOtherComponent: true,
        skipDetailedValidation: true,
        snapshotPath: import.meta.path,
      })

      expect(fanoutSolverInputs, placement).toEqual([
        expected.soc,
        expected.dram,
      ])
    }
  } finally {
    fanoutStart.mockRestore()
  }
}, 30_000)
