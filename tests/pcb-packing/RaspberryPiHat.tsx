import type { ChipProps } from "@tscircuit/props"

export const RaspberryPiHatBoard = (props: ChipProps & { children?: any }) => {
  const pinLabels = {
    pin1: ["V3_3_1"],
    pin2: ["V5_1"],
    pin3: ["V5_2"],
    pin4: ["GND_1"],
    pin5: ["GPIO_14", "TX"],
    pin6: ["GPIO_15", "RX"],
    pin7: ["GPIO_18", "PCM_CLK"],
    pin8: ["GND_2"],
    pin9: ["GPIO_23"],
    pin10: ["GPIO_24"],
    pin11: ["GND_3"],
    pin12: ["GPIO_25"],
    pin13: ["GPIO_8", "CE0"],
    pin14: ["GPIO_7", "CE1"],
    pin15: ["GPIO_1", "ID_SC"],
    pin16: ["GND_4"],
    pin17: ["GPIO_12", "PWM0"],
    pin18: ["GND_5"],
    pin19: ["GPIO_16"],
    pin20: ["GPIO_20", "PCM_DIN"],
    pin21: ["GPIO_21", "PCM_DOUT"],
    pin22: ["GND_6"],
    pin23: ["GPIO_26"],
    pin24: ["GPIO_19", "PCM_FS"],
    pin25: ["GPIO_13", "PWM1"],
    pin26: ["GPIO_6"],
    pin27: ["GPIO_5"],
    pin28: ["GPIO_0", "ID_SD"],
    pin29: ["GND_7"],
    pin30: ["GPIO_11", "SCLK"],
    pin31: ["GPIO_9", "MISO"],
    pin32: ["GPIO_10", "MOSI"],
    pin33: ["V3_3_2"],
    pin34: ["GPIO_22"],
    pin35: ["GPIO_27"],
    pin36: ["GPIO_17"],
    pin37: ["GND_8"],
    pin38: ["GPIO_4", "GPCLK0"],
    pin39: ["GPIO_3", "SCL"],
    pin40: ["GPIO_2", "SDA"],
  }

  return (
    <board width={66} height={66}>
      <group>
        <chip
          name="JP1"
          schWidth={3.5}
          pinLabels={pinLabels}
          layer="bottom"
          footprint="pinrow40_rows2_nopinlabels_p2.54_id1.016_od1.524"
          pcbY={23.23}
          pcbRotation={180}
          showPinAliases
          schPinArrangement={{
            leftSide: {
              direction: "top-to-bottom",
              pins: [
                "V3_3_1",
                "V3_3_2",
                "V5_1",
                "V5_2",
                "GPIO_14",
                "GPIO_15",
                "GPIO_3",
                "GPIO_2",
                "GPIO_20",
                "GPIO_21",
                "GPIO_9",
                "GPIO_10",
                "GND_1",
                "GND_2",
                "GND_3",
                "GND_4",
                "GND_5",
                "GND_6",
                "GND_7",
                "GND_8",
              ],
            },
            rightSide: {
              direction: "top-to-bottom",
              pins: [
                "GPIO_18",
                "GPIO_11",
                "GPIO_24",
                "GPIO_25",
                "GPIO_8",
                "GPIO_7",
                "GPIO_12",
                "GPIO_13",
                "GPIO_26",
                "GPIO_19",
                "GPIO_16",
                "GPIO_6",
                "GPIO_5",
                "GPIO_0",
                "GPIO_22",
                "GPIO_27",
                "GPIO_17",
                "GPIO_4",
                "GPIO_1",
              ],
            },
          }}
          schPinStyle={{
            pin3: {
              marginBottom: 0.3,
            },
            pin6: {
              marginBottom: 0.3,
            },
            pin40: {
              marginBottom: 0.3,
            },
            pin21: {
              marginBottom: 0.3,
            },
            pin32: {
              marginBottom: 0.3,
            },
            pin30: {
              marginBottom: 0.3,
            },
            pin12: {
              marginBottom: 0.3,
            },
            pin14: {
              marginBottom: 0.3,
            },
            pin25: {
              marginBottom: 0.3,
            },
          }}
        />
        <hole diameter={2.8} pcbX={-29} pcbY={24.5} />
        <hole diameter={2.8} pcbX={29} pcbY={-24.5} />
        <hole diameter={2.8} pcbX={-29} pcbY={-24.5} />
        <hole diameter={2.8} pcbX={29} pcbY={24.5} />
        {props.children}
      </group>
    </board>
  )
}
