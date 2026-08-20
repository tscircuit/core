import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  AsyncFourPadPushbuttonCircuit,
  loadKicadPushbuttonFootprint,
} from "./repro-async-four-pad-pushbutton.fixture"

test("async four-pad pushbutton footprint attaches every pad to a port", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: loadKicadPushbuttonFootprint,
      },
    },
  })

  circuit.add(<AsyncFourPadPushbuttonCircuit />)

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
