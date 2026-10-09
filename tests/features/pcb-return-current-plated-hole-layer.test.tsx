import { simulation } from "lib"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("multilayer physical ground ports require an explicit layer for both return terminals", async () => {
  const { circuit: invalid } = getTestFixture()
  invalid.add(<ReturnCurrentBoard groundPortType="platedhole" />)
  await expect(invalid.renderUntilSettled()).rejects.toThrow(
    'Return source ".U2 > .GND" spans multiple layers; specify returnSourceLayer',
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <ReturnCurrentBoard groundPortType="platedhole">
      <simulation.pcbreturncurrentsimulation name="Through-hole returns use bottom copper">
        <simulation.pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
          returnSourceLayer="bottom"
          returnSinkLayer="bottom"
        />
      </simulation.pcbreturncurrentsimulation>
      <pcbnotetext
        text="GND contact layer: bottom"
        pcbY={-1.7}
        fontSize={0.45}
      />
    </ReturnCurrentBoard>,
  )
  await circuit.renderUntilSettled()
  const [excitation] = circuit.db.simulation_return_current_excitation.list()
  expect(excitation.return_source.layer).toBe("bottom")
  expect(excitation.return_sink.layer).toBe("bottom")
  expect(excitation.source_port?.reference_layer).toBe("bottom")
  expect(excitation.load_port?.reference_layer).toBe("bottom")
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
