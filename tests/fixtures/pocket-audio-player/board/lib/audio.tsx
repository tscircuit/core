import { PCM5102APWR } from "../imports/PCM5102APWR"
import { TPA6132A2RTER } from "../imports/TPA6132A2RTER"
import { SJ13533Ng } from "./sj1-3533ng"
import { R, C } from "./passives"

export function Audio() {
  return (
    <>
      <schematicsheet
        name="dac"
        displayName={"U4 PCM5102A\n3.3 V stereo I2S DAC"}
        sheetIndex={5}
      >
        <group
          name="dac_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <C
            name="C30"
            capacitance="100nF"
            from="A3V3"
            pcbX={5.8}
            pcbY={12.1}
            layer="top"
          />
          <C
            name="C31"
            capacitance="10uF"
            from="A3V3"
            pcbX={1.2}
            pcbY={5.7}
            pcbRotation={180}
            layer="top"
          />
          <R
            name="R30"
            resistance="0"
            from="V3V3"
            to="A3V3"
            pcbX={-5}
            pcbY={13}
            layer="bottom"
          />
          <PCM5102APWR
            name="U4"
            pcbX={0}
            pcbY={6}
            layer="bottom"
            pcbRotation={90}
            connections={{
              CPVDD: "net.A3V3",
              AVDD: "net.A3V3",
              DVDD: "net.V3V3",
              CPGND: "net.GND",
              AGND: "net.GND",
              DGND: "net.GND",
              CAPP: "net.DAC_CAPP",
              CAPM: "net.DAC_CAPM",
              VNEG: "net.DAC_VNEG",
              LDOO: "net.DAC_LDO",
              OUTL: "net.DAC_LEFT",
              OUTR: "net.DAC_RIGHT",
              DEMP: "net.GND",
              FLT: "net.GND",
              SCK: "net.GND",
              FMT: "net.GND",
              BCK: "net.I2S_BCLK",
              LRCK: "net.I2S_LRCLK",
              DIN: "net.I2S_DOUT",
              XSMT: "net.AUDIO_ENABLE",
            }}
          />
          <group
            name="U4_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"Stereo I2S DAC\n3.3 V"}
            pcbRelative
          />

          <C
            name="C32"
            capacitance="100nF"
            from="V3V3"
            pcbX={7}
            pcbY={10}
            layer="bottom"
          />
          <C
            name="C33"
            capacitance="1uF"
            from="DAC_LDO"
            pcbX={-1.6}
            pcbY={7.8}
            layer="top"
          />
          <C
            name="C34"
            capacitance="1uF"
            from="DAC_CAPP"
            to="DAC_CAPM"
            pcbX={5}
            pcbY={7.65}
            pcbRotation={-90}
            layer="top"
          />
          <C
            name="C35"
            capacitance="1uF"
            from="DAC_VNEG"
            pcbX={7.65}
            pcbY={6.2}
            layer="top"
          />
          <R
            name="R31"
            pcbRotation={180}
            resistance="100k"
            from="AUDIO_ENABLE"
            to="GND"
            pcbX={7}
            pcbY={-1}
            layer="bottom"
          />
          <R
            name="R32"
            resistance="470k"
            from="DAC_LEFT"
            to="GND"
            pcbX={9}
            pcbY={4}
            layer="bottom"
          />
          <R
            name="R33"
            resistance="470k"
            from="DAC_RIGHT"
            to="GND"
            pcbX={9}
            pcbY={1}
            layer="bottom"
          />
        </group>
      </schematicsheet>
      <schematicsheet
        name="amp"
        displayName={"U5 TPA6132A2\n3.3 V, -6 dB headphone gain"}
        sheetIndex={6}
      >
        <group
          name="amp_components"
          schGrid
          gridCols={4}
          gridGap={2.5}
          pcbRelative
        >
          <C
            name="C36"
            pcbRotation={180}
            capacitance="1uF"
            from="DAC_LEFT"
            to="AMP_LEFT"
            pcbX={12}
            pcbY={8}
            layer="bottom"
          />
          <C
            name="C37"
            pcbRotation={180}
            capacitance="1uF"
            from="DAC_RIGHT"
            to="AMP_RIGHT"
            pcbX={12}
            pcbY={11}
            layer="bottom"
          />
          <TPA6132A2RTER
            name="U5"
            pcbX={17}
            pcbY={8}
            layer="bottom"
            connections={{
              INL_NEG: "net.AMP_LEFT",
              INR_NEG: "net.AMP_RIGHT",
              INL_POS: "net.GND",
              INR_POS: "net.GND",
              OUTL: "net.HP_LEFT",
              OUTR: "net.HP_RIGHT",
              G0: "net.GND",
              G1: "net.GND",
              EN: "net.AUDIO_ENABLE",
              VDD: "net.A3V3",
              PGND: "net.GND",
              SGND: "net.GND",
              EP: "net.GND",
              CPN: "net.AMP_CPN",
              CPP: "net.AMP_CPP",
              HPVDD: "net.AMP_HPVDD",
              HPVSS: "net.AMP_HPVSS",
            }}
          />
          <group
            name="U5_function"
            showAsSchematicBox
            schWidth={0.1}
            schHeight={0.1}
            schTitle={"Headphone amplifier\n3.3 V, -6 dB"}
            pcbRelative
          />
          <C
            name="C38"
            pcbRotation={180}
            capacitance="2.2uF"
            from="A3V3"
            pcbX={17}
            pcbY={13}
            layer="bottom"
          />
          <C
            name="C39"
            capacitance="2.2uF"
            from="AMP_HPVDD"
            pcbX={21}
            pcbY={12}
            layer="bottom"
          />
          <C
            name="C40"
            capacitance="1uF"
            from="AMP_CPP"
            to="AMP_CPN"
            pcbX={21}
            pcbY={5}
            layer="bottom"
          />
          <C
            name="C41"
            capacitance="1uF"
            from="AMP_HPVSS"
            pcbX={17}
            pcbY={4}
            layer="bottom"
          />
          <SJ13533Ng
            name="J4"
            pcbX={22.3}
            pcbY={-2}
            pcbRotation={-90}
            connections={{
              SLEEVE: "net.GND",
              TIP: "net.HP_LEFT",
              RING: "net.HP_RIGHT",
            }}
          />
        </group>
      </schematicsheet>
    </>
  )
}
