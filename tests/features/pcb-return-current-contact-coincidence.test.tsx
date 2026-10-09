import { simulation } from "lib"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("same-layer coincident signal and return contacts are rejected while explicit opposite-layer contacts remain valid", async () => {
  for (const layer of ["top", "bottom"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <ReturnCurrentBoard>
        <chip
          name="G1"
          pcbX={-2}
          layer={layer}
          pinLabels={{ pin1: "GND" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                width={0.6}
                height={0.6}
                shape="rect"
              />
            </footprint>
          }
        />
        <trace from=".G1 > .GND" to="net.GND" />
        <simulation.pcbreturncurrentsimulation name="Ground contact beneath the signal">
          <simulation.pcbreturncurrentexcitation
            {...returnCurrentExcitationProps}
            returnSink=".G1 > .GND"
          />
        </simulation.pcbreturncurrentsimulation>
        <pcbnotetext
          text="G1.GND beneath U1.OUT: bottom layer"
          pcbY={-1.8}
          fontSize={0.35}
        />
      </ReturnCurrentBoard>,
    )
    if (layer === "top") {
      await expect(circuit.renderUntilSettled()).rejects.toThrow(
        "different physical PCB locations on the same layer",
      )
    } else {
      await circuit.renderUntilSettled()
      const [excitation] =
        circuit.db.simulation_return_current_excitation.list()
      expect(excitation.return_sink).toMatchObject({
        x: -2,
        y: 0,
        layer: "bottom",
        contact_type: "pcb_port",
      })
      expect(excitation.source_port?.reference_layer).toBe("bottom")
      expect(excitation.source_port?.signal_pcb_port_id).not.toBe(
        excitation.source_port?.reference_pcb_port_id,
      )
      await expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
