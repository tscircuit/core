import { expect, test } from "bun:test"
import type { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getChipPinMetadataFixture } from "tests/fixtures/get-chip-pin-metadata-fixture"

test("async datasheet validation does not restart routing when routing is disabled", async () => {
  for (const disableVia of ["platform", "board"] as const) {
    const { partsEngine } = getChipPinMetadataFixture([{}, {}])
    const { circuit } = getTestFixture({
      platform: { routingDisabled: disableVia === "platform" },
    })
    circuit.add(
      <board
        width={18}
        height={10}
        routingDisabled={disableVia === "board"}
        partsEngine={partsEngine}
      >
        <chip
          name="U1"
          manufacturerPartNumber="SWITCH"
          footprint="pinrow2"
          pcbX={-4}
        />
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} />
        <trace from=".U1 > .pin1" to=".R1 > .pin1" maxLength={1} />
        <pcbnotetext
          text="Routing disabled; async datasheet fetch must not start routing"
          pcbY={3}
          fontSize={0.35}
        />
        <pcbnotetext
          text="Endpoints exceed 1mm limit; no autorouting errors expected"
          pcbY={-3}
          fontSize={0.35}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const chip = circuit.selectOne(".U1") as Chip
    expect(chip._fetchedSourcePortsForPinAttributes).toHaveLength(2)
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(circuit.db.pcb_trace.list()).toEqual([])
    if (disableVia === "board")
      expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
})
