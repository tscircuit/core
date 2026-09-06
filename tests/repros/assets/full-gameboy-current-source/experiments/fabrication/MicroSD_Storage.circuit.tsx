import type { GroupProps } from "@tscircuit/props"
import { TF_01A } from "./imports/TF_01A/TF_01A"
import { A_0402WGF1002TCE } from "./imports/A_0402WGF1002TCE/A_0402WGF1002TCE"
import { CL05B104KO5NNNC } from "./imports/CL05B104KO5NNNC/CL05B104KO5NNNC"
import { CL10A106KP8NNNC } from "./imports/CL10A106KP8NNNC/CL10A106KP8NNNC"
import { SRV05_4_P_T7 } from "./imports/SRV05_4_P_T7/SRV05_4_P_T7"

// Normal group: these connections are routed together with the parent board.
export const MicroSDStorage = ({
  sdDetectEscape = false,
  ...props
}: GroupProps & { sdDetectEscape?: boolean }) => (
  <group {...props}>
    {/* The mouth faces +Y in this group's local coordinates. The parent rotates
        the whole group 180 degrees to face outward at the bottom board edge. */}
    <TF_01A name="J_SD" pcbRotation={180} schX={0} schY={0} />
    <CL10A106KP8NNNC
      name="C_SD_BULK"
      pcbX={0.4}
      pcbY={-8.2}
      pcbRotation={90}
      schX={-5}
      schY={-4}
      maxVoltageRating="10V"
      maxDecouplingTraceLength="5.5mm"
    />
    <CL05B104KO5NNNC
      name="C_SD_HF"
      pcbX={2.2}
      pcbY={-8.2}
      pcbRotation={90}
      schX={-2}
      schY={-4}
      maxVoltageRating="16V"
      maxDecouplingTraceLength="5.5mm"
    />
    <A_0402WGF1002TCE
      name="R_SD_DAT2"
      pcbX={-4.5}
      pcbY={-8.5}
      pcbRotation={90}
      schX={-6}
      schY={5}
    />
    <A_0402WGF1002TCE
      name="R_SD_CS"
      pcbX={-2.9}
      pcbY={-8.2}
      pcbRotation={90}
      schX={-3}
      schY={5}
    />
    <A_0402WGF1002TCE
      name="R_SD_CMD"
      pcbX={-1.3}
      pcbY={-8.2}
      pcbRotation={90}
      schX={0}
      schY={5}
    />
    <A_0402WGF1002TCE
      name="R_SD_DAT0"
      pcbX={4.1}
      pcbY={-8.2}
      pcbRotation={90}
      schX={3}
      schY={5}
    />
    <A_0402WGF1002TCE
      name="R_SD_DAT1"
      pcbX={5.7}
      pcbY={-8.2}
      pcbRotation={90}
      schX={6}
      schY={5}
    />
    <A_0402WGF1002TCE
      name="R_SD_CD"
      pcbX={sdDetectEscape ? 28.6 : 7.3}
      pcbY={sdDetectEscape ? -40.2 : -8.5}
      pcbRotation={90}
      schX={9}
      schY={5}
    />
    <SRV05_4_P_T7 name="U_SD_ESD" pcbX={1.5} pcbY={-12} schX={8} schY={-2} />

    <trace name="SD_VDD" from=".J_SD > .VDD" to="net.V3V3" thickness="0.3mm" />
    <trace name="SD_GND" from=".J_SD > .VSS" to="net.GND" />
    <trace name="SD_SHIELD1" from=".J_SD > .GND1" to="net.GND" />
    <trace name="SD_SHIELD2" from=".J_SD > .GND2" to="net.GND" />
    <trace name="SD_SHIELD3" from=".J_SD > .GND3" to="net.GND" />
    <trace name="SD_SHIELD4" from=".J_SD > .GND4" to="net.GND" />
    <trace
      name="SD_BULK"
      from=".C_SD_BULK > .pin1"
      to=".J_SD > .VDD"
      maxLength="5.5mm"
    />
    <trace
      name="SD_HF"
      from=".C_SD_HF > .pin1"
      to=".J_SD > .VDD"
      maxLength="5.5mm"
    />
    <trace from=".C_SD_BULK > .pin2" to="net.GND" />
    <trace from=".C_SD_HF > .pin2" to="net.GND" />

    {/* SD requires pull-ups on CMD and DAT0..3 even in SPI mode. CLK has none. */}
    <trace from=".R_SD_DAT2 > .pin1" to=".J_SD > .DAT2" />
    <trace from=".R_SD_CS > .pin1" to=".J_SD > .CS" />
    <trace from=".R_SD_CMD > .pin1" to=".J_SD > .MOSI" />
    <trace from=".R_SD_DAT0 > .pin1" to=".J_SD > .MISO" />
    <trace from=".R_SD_DAT1 > .pin1" to=".J_SD > .DAT1" />
    <trace from=".R_SD_CD > .pin1" to=".J_SD > .CD" />
    <trace from=".R_SD_DAT2 > .pin2" to="net.V3V3" />
    <trace from=".R_SD_CS > .pin2" to="net.V3V3" />
    <trace from=".R_SD_CMD > .pin2" to="net.V3V3" />
    <trace from=".R_SD_DAT0 > .pin2" to="net.V3V3" />
    <trace from=".R_SD_DAT1 > .pin2" to="net.V3V3" />
    <trace from=".R_SD_CD > .pin2" to="net.V3V3" />

    <trace from=".U_SD_ESD > .pin1" to=".J_SD > .CS" />
    <trace from=".U_SD_ESD > .pin3" to=".J_SD > .MOSI" />
    <trace from=".U_SD_ESD > .pin4" to=".J_SD > .CLK" />
    <trace from=".U_SD_ESD > .pin6" to=".J_SD > .MISO" />
    <trace from=".U_SD_ESD > .pin2" to="net.GND" />
    <trace from=".U_SD_ESD > .pin5" to="net.V3V3" />
  </group>
)
