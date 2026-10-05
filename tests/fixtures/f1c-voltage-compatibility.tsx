import type { RootCircuit } from "lib/RootCircuit"
import type { PinAttributeMap } from "@tscircuit/props"

export const addF1cVoltageCircuit = (
  circuit: RootCircuit,
  outputVoltage: string,
  requiredVoltageTolerance?: PinAttributeMap["requiredVoltageTolerance"],
  attributePinLabel = "AVCC",
) => {
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <chip
        name="U_F1C"
        manufacturerPartNumber="F1C100S"
        schX={3}
        pinLabels={{ pin80: "AVCC" }}
        schPinArrangement={{
          leftSide: { pins: ["pin80"], direction: "top-to-bottom" },
        }}
        pinAttributes={{
          [attributePinLabel]: {
            requiresVoltage: "2.8V",
            requiredVoltageTolerance,
            requiresPower: true,
            mustBeConnected: true,
          },
        }}
        connections={{ AVCC: "net.AVCC" }}
      />
      <chip
        name="U_REG"
        schX={-3}
        pinLabels={{ pin5: "VOUT" }}
        schPinArrangement={{
          rightSide: { pins: ["pin5"], direction: "top-to-bottom" },
        }}
        pinAttributes={{
          VOUT: { providesVoltage: outputVoltage, providesPower: true },
        }}
        connections={{ VOUT: "net.AVCC" }}
      />
      <schematictext
        text={`VOUT provides ${outputVoltage}; AVCC requires 2.8 V${requiredVoltageTolerance === undefined ? "" : ` ± ${requiredVoltageTolerance}`}`}
        schX={0}
        schY={-4.8}
        fontSize={0.2}
      />
    </board>,
  )
}
