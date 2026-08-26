import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SMALL_BGA_FOOTPRINT =
  "bga16_grid4x4_p0.8mm_pad0.3mm_circularpads" as const

const CONTROL_PIN_LABELS = {
  pin5: ["RESET_IN_N"],
  pin9: ["FORCE_RECOVERY_N"],
  pin13: ["RESET_OUT_N"],
} as const

const CONTROL_SIGNALS = [
  ["RESET_IN_N", "R1", 3],
  ["FORCE_RECOVERY_N", "R2", 0],
  ["RESET_OUT_N", "R3", -3],
] as const

test("repro: compacted fanout exits disconnect traces joined through nets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="26mm"
      height="18mm"
      layers={4}
      autorouter="default"
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
      isViaInPadAllowed
    >
      <breakout
        name="U1_FANOUT"
        width="12mm"
        height="12mm"
        autorouter={{ preset: "fanout", allowViaInPad: true }}
        fanoutRoutingLayers={["top", "bottom"]}
        busFanoutDirections={{ CONTROL: "center_left" }}
      >
        <chip
          name="U1"
          footprint={SMALL_BGA_FOOTPRINT}
          pinLabels={CONTROL_PIN_LABELS}
          noSchematicRepresentation
        />
        {CONTROL_SIGNALS.map(([signal, , breakoutY]) => (
          <Fragment key={signal}>
            <fanoutpoint
              connection={`.U1 > .${signal}`}
              pcbX={-8}
              pcbY={breakoutY}
            />
            <trace
              name={`U1_${signal}`}
              from={`.U1 > .${signal}`}
              to={`net.${signal}`}
            />
          </Fragment>
        ))}
      </breakout>

      <bus
        name="CONTROL"
        connections={CONTROL_SIGNALS.map(([signal]) => `U1_${signal}`)}
      />

      {CONTROL_SIGNALS.map(([signal, resistorName, resistorY]) => (
        <Fragment key={resistorName}>
          <resistor
            name={resistorName}
            resistance="10k"
            footprint="0402"
            pcbX={-11}
            pcbY={resistorY}
          />
          <trace
            name={`${signal}_RESISTOR`}
            from={`.${resistorName} > .pin2`}
            to={`net.${signal}`}
          />
        </Fragment>
      ))}

      <pcbnotetext
        text="EXPECTED: 3 RESISTOR TRACES CONNECT TO BGA U1"
        pcbY={8}
        fontSize="0.45mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(3)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
