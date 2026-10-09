import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
const pinLabels = {
  pin1: ["PE2"],
  pin2: ["PE3"],
  pin3: ["PE4"],
  pin4: ["PE5"],
  pin5: ["PE6"],
  pin6: ["VBAT"],
  pin7: ["PC13"],
  pin8: ["PC14"],
  pin9: ["PC15"],
  pin10: ["VSS4"],
  pin11: ["VDD6"],
  pin12: ["PH0"],
  pin13: ["PH1"],
  pin14: ["NRST"],
  pin15: ["PC0"],
  pin16: ["PC1"],
  pin17: ["PC2"],
  pin18: ["PC3"],
  pin19: ["VDD5"],
  pin20: ["VSSA"],
  pin21: ["VREF_POS"],
  pin22: ["VDDA"],
  pin23: ["PA0"],
  pin24: ["PA1"],
  pin25: ["PA2"],
  pin26: ["PA3"],
  pin27: ["VSS3"],
  pin28: ["VDD4"],
  pin29: ["PA4"],
  pin30: ["PA5"],
  pin31: ["PA6"],
  pin32: ["PA7"],
  pin33: ["PC4"],
  pin34: ["PC5"],
  pin35: ["PB0"],
  pin36: ["PB1"],
  pin37: ["PB2"],
  pin38: ["PE7"],
  pin39: ["PE8"],
  pin40: ["PE9"],
  pin41: ["PE10"],
  pin42: ["PE11"],
  pin43: ["PE12"],
  pin44: ["PE13"],
  pin45: ["PE14"],
  pin46: ["PE15"],
  pin47: ["PB10"],
  pin48: ["PB11"],
  pin49: ["VCAP_1"],
  pin50: ["VDD3"],
  pin51: ["PB12"],
  pin52: ["PB13"],
  pin53: ["PB14"],
  pin54: ["PB15"],
  pin55: ["PD8"],
  pin56: ["PD9"],
  pin57: ["PD10"],
  pin58: ["PD11"],
  pin59: ["PD12"],
  pin60: ["PD13"],
  pin61: ["PD14"],
  pin62: ["PD15"],
  pin63: ["PC6"],
  pin64: ["PC7"],
  pin65: ["PC8"],
  pin66: ["PC9"],
  pin67: ["PA8"],
  pin68: ["PA9"],
  pin69: ["PA10"],
  pin70: ["PA11"],
  pin71: ["PA12"],
  pin72: ["PA13"],
  pin73: ["VCAP_2"],
  pin74: ["VSS2"],
  pin75: ["VDD2"],
  pin76: ["PA14"],
  pin77: ["PA15"],
  pin78: ["PC10"],
  pin79: ["PC11"],
  pin80: ["PC12"],
  pin81: ["PD0"],
  pin82: ["PD1"],
  pin83: ["PD2"],
  pin84: ["PD3"],
  pin85: ["PD4"],
  pin86: ["PD5"],
  pin87: ["PD6"],
  pin88: ["PD7"],
  pin89: ["PB3"],
  pin90: ["PB4"],
  pin91: ["PB5"],
  pin92: ["PB6"],
  pin93: ["PB7"],
  pin94: ["BOOT0"],
  pin95: ["PB8"],
  pin96: ["PB9"],
  pin97: ["PE0"],
  pin98: ["PE1"],
  pin99: ["VSS1"],
  pin100: ["VDD1"],
} as const

const mcuPads = [
  [100, -7.549896, -5.999988, 1.5999968, 0.2999994, 0.1499997],
  [99, -7.549896, -5.500116, 1.5999968, 0.2999994, 0.1499997],
  [98, -7.549896, -4.99999, 1.5999968, 0.2999994, 0.1499997],
  [97, -7.549896, -4.500118, 1.5999968, 0.2999994, 0.1499997],
  [96, -7.549896, -3.999992, 1.5999968, 0.2999994, 0.1499997],
  [95, -7.549896, -3.50012, 1.5999968, 0.2999994, 0.1499997],
  [94, -7.549896, -2.999994, 1.5999968, 0.2999994, 0.1499997],
  [93, -7.549896, -2.500122, 1.5999968, 0.2999994, 0.1499997],
  [92, -7.549896, -1.999996, 1.5999968, 0.2999994, 0.1499997],
  [91, -7.549896, -1.500124, 1.5999968, 0.2999994, 0.1499997],
  [90, -7.549896, -0.999998, 1.5999968, 0.2999994, 0.1499997],
  [89, -7.549896, -0.499872, 1.5999968, 0.2999994, 0.1499997],
  [88, -7.549896, 0, 1.5999968, 0.2999994, 0.1499997],
  [87, -7.549896, 0.500126, 1.5999968, 0.2999994, 0.1499997],
  [86, -7.549896, 0.999998, 1.5999968, 0.2999994, 0.1499997],
  [85, -7.549896, 1.500124, 1.5999968, 0.2999994, 0.1499997],
  [84, -7.549896, 1.999996, 1.5999968, 0.2999994, 0.1499997],
  [83, -7.549896, 2.500122, 1.5999968, 0.2999994, 0.1499997],
  [82, -7.549896, 2.999994, 1.5999968, 0.2999994, 0.1499997],
  [81, -7.549896, 3.50012, 1.5999968, 0.2999994, 0.1499997],
  [80, -7.549896, 3.999992, 1.5999968, 0.2999994, 0.1499997],
  [79, -7.549896, 4.500118, 1.5999968, 0.2999994, 0.1499997],
  [78, -7.549896, 4.99999, 1.5999968, 0.2999994, 0.1499997],
  [77, -7.549896, 5.500116, 1.5999968, 0.2999994, 0.1499997],
  [76, -7.549896, 5.999988, 1.5999968, 0.2999994, 0.1499997],
  [75, -5.999988, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [74, -5.500116, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [73, -4.99999, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [72, -4.500118, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [71, -3.999992, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [70, -3.50012, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [69, -2.999994, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [68, -2.500122, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [67, -1.999996, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [66, -1.500124, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [65, -0.999998, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [64, -0.499872, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [63, 0, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [62, 0.500126, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [61, 0.999998, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [60, 1.500124, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [59, 1.999996, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [58, 2.500122, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [57, 2.999994, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [56, 3.50012, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [55, 3.999992, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [54, 4.500118, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [53, 4.99999, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [52, 5.500116, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [51, 5.999988, 7.549896, 0.2999994, 1.5999968, 0.1499997],
  [50, 7.549896, 5.999988, 1.5999968, 0.2999994, 0.1499997],
  [49, 7.549896, 5.500116, 1.5999968, 0.2999994, 0.1499997],
  [48, 7.549896, 4.99999, 1.5999968, 0.2999994, 0.1499997],
  [47, 7.549896, 4.500118, 1.5999968, 0.2999994, 0.1499997],
  [46, 7.549896, 3.999992, 1.5999968, 0.2999994, 0.1499997],
  [45, 7.549896, 3.50012, 1.5999968, 0.2999994, 0.1499997],
  [44, 7.549896, 2.999994, 1.5999968, 0.2999994, 0.1499997],
  [43, 7.549896, 2.500122, 1.5999968, 0.2999994, 0.1499997],
  [42, 7.549896, 1.999996, 1.5999968, 0.2999994, 0.1499997],
  [41, 7.549896, 1.500124, 1.5999968, 0.2999994, 0.1499997],
  [40, 7.549896, 0.999998, 1.5999968, 0.2999994, 0.1499997],
  [39, 7.549896, 0.500126, 1.5999968, 0.2999994, 0.1499997],
  [38, 7.549896, 0, 1.5999968, 0.2999994, 0.1499997],
  [37, 7.549896, -0.499872, 1.5999968, 0.2999994, 0.1499997],
  [36, 7.549896, -0.999998, 1.5999968, 0.2999994, 0.1499997],
  [35, 7.549896, -1.500124, 1.5999968, 0.2999994, 0.1499997],
  [34, 7.549896, -1.999996, 1.5999968, 0.2999994, 0.1499997],
  [33, 7.549896, -2.500122, 1.5999968, 0.2999994, 0.1499997],
  [32, 7.549896, -2.999994, 1.5999968, 0.2999994, 0.1499997],
  [31, 7.549896, -3.50012, 1.5999968, 0.2999994, 0.1499997],
  [30, 7.549896, -3.999992, 1.5999968, 0.2999994, 0.1499997],
  [29, 7.549896, -4.500118, 1.5999968, 0.2999994, 0.1499997],
  [28, 7.549896, -4.99999, 1.5999968, 0.2999994, 0.1499997],
  [27, 7.549896, -5.500116, 1.5999968, 0.2999994, 0.1499997],
  [26, 7.549896, -5.999988, 1.5999968, 0.2999994, 0.1499997],
  [25, 5.999988, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [24, 5.500116, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [23, 4.99999, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [22, 4.500118, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [21, 3.999992, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [20, 3.50012, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [19, 2.999994, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [18, 2.500122, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [17, 1.999996, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [16, 1.500124, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [15, 0.999998, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [14, 0.500126, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [13, 0, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [12, -0.499872, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [11, -0.999998, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [10, -1.500124, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [9, -1.999996, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [8, -2.500122, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [7, -2.999994, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [6, -3.50012, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [5, -3.999992, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [4, -4.500118, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [3, -4.99999, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [2, -5.500116, -7.549896, 0.2999994, 1.5999968, 0.1499997],
  [1, -5.999988, -7.549896, 0.2999994, 1.5999968, 0.1499997],
] as const

// STM32F407VG LQFP100, DS8626: AF12 FSMC data pin mapping.
const dataPins = [
  "PD14",
  "PD15",
  "PD0",
  "PD1",
  "PE7",
  "PE8",
  "PE9",
  "PE10",
  "PE11",
  "PE12",
  "PE13",
  "PE14",
  "PE15",
  "PD8",
  "PD9",
  "PD10",
]
const controls = [
  ["WR", "PD5"],
  ["RD", "PD4"],
  ["CS", "PD7"],
  ["RS", "PD11"],
  ["RESET", "PC6"],
] as const
const powerPins = [
  "VBAT",
  "VDD1",
  "VDD2",
  "VDD3",
  "VDD4",
  "VDD5",
  "VDD6",
  "VDDA",
  "VREF_POS",
]
const groundPins = ["VSS1", "VSS2", "VSS3", "VSS4", "VSSA"]
const lcdLabels = [
  ...dataPins.map((_, i) => `D${i}`),
  ...controls.map(([s]) => s),
  "GND",
  "V3V3",
  "GND2",
]
const caps = [
  [-36, 9],
  [-36, 3],
  [-36, -3],
  [-30, -7],
  [-19, -7],
  [-14, 6],
  [-20, 15],
  [-28, 15],
]

test("reproduces Pipeline 9 rerouting completed top-only LCD bus lanes", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <board
      width="90mm"
      height="55mm"
      layers={2}
      autorouterVersion="beta_pipeline9"
      autorouter="auto_local"
      minTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.15mm"
      minBoardEdgeClearance="0.5mm"
    >
      <net name="V3V3" isPowerNet routingPhaseIndex={2} />
      <net name="GND" isGroundNet routingPhaseIndex={2} />
      <chip
        pinLabels={pinLabels}
        footprint={
          <footprint>
            {mcuPads.map(([pin, pcbX, pcbY, width, height, radius]) => (
              <smtpad
                portHints={[`pin${pin}`]}
                pcbX={pcbX}
                pcbY={pcbY}
                width={width}
                height={height}
                radius={radius}
                shape="pill"
              />
            ))}
          </footprint>
        }
        name="U1"
        pcbX={-25}
        pcbY={4}
      />
      <pinheader
        name="JLCD"
        pinCount={24}
        pitch="1.27mm"
        holeDiameter={0.5}
        platedDiameter={0.9}
        pcbX={35}
        pcbY={0}
        pcbRotation={270}
        pinLabels={lcdLabels}
      />
      {dataPins.map((pin, i) => (
        <resistor
          key={pin}
          name={`R${i + 1}`}
          resistance="33"
          footprint="0402"
          pcbX={0}
          pcbY={14.605 - i * 1.27}
        />
      ))}
      {dataPins.map((pin, i) => (
        <trace
          key={`in${i}`}
          name={`FSMC_D${i}`}
          from={`.U1 > .${pin}`}
          to={`.R${i + 1} > .pin1`}
        />
      ))}
      {dataPins.map((pin, i) => (
        <trace
          key={`out${i}`}
          name={`LCD_D${i}`}
          from={`.R${i + 1} > .pin2`}
          to={`.JLCD > .pin${i + 1}`}
        />
      ))}
      <bus
        name="LCD_DATA"
        connections={dataPins.map((_, i) => `LCD_D${i}`)}
        pcbTraceWidth="0.2mm"
        maxLengthSkew="0.1mm"
        pcbAllowedLayers={["top"]}
      />
      {
        <autoroutingphase
          name="LCD_LANES"
          phaseIndex={0}
          autorouter="bus_lanes"
          connections={dataPins.map((_, i) => `R${i + 1}.pin2`)}
        />
      }
      <autoroutingphase
        name="MCU_DATA_FANOUT"
        phaseIndex={1}
        autorouter="auto_local"
        connections={dataPins.map((p) => `U1.${p}`)}
      />
      <autoroutingphase
        name="CONTROL_POWER_DEBUG"
        phaseIndex={2}
        autorouter="auto_local"
        connections={[
          ...controls.map(([, pin]) => `U1.${pin}`),
          ...powerPins.map((pin) => `U1.${pin}`),
          ...groundPins.map((pin) => `U1.${pin}`),
          "U1.VCAP_1",
          "U1.VCAP_2",
          "U1.NRST",
          "U1.BOOT0",
          "U1.PB2",
          "U1.PA13",
          "U1.PA14",
        ]}
      />
      {controls.map(([name, pin], i) => (
        <trace
          key={name}
          name={`LCD_${name}`}
          from={`.U1 > .${pin}`}
          to={`.JLCD > .pin${17 + i}`}
        />
      ))}
      <trace from=".JLCD > .pin22" to="net.GND" />
      <trace from=".JLCD > .pin23" to="net.V3V3" />
      <trace from=".JLCD > .pin24" to="net.GND" />
      {powerPins.map((p) => (
        <trace key={p} from={`.U1 > .${p}`} to="net.V3V3" />
      ))}
      {groundPins.map((p) => (
        <trace key={p} from={`.U1 > .${p}`} to="net.GND" />
      ))}
      {caps.map(([x, y], i) => (
        <capacitor
          key={i}
          name={`C${i + 1}`}
          capacitance="100nF"
          footprint="0402"
          pcbX={x}
          pcbY={y}
          pcbRotation={i === 6 ? 180 : 0}
          connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
        />
      ))}
      <capacitor
        name="C9"
        capacitance="4.7uF"
        footprint="0603"
        pcbX={-35}
        pcbY={-16}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <capacitor
        name="C10"
        capacitance="1uF"
        footprint="0603"
        pcbX={-36}
        pcbY={-6}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <capacitor
        name="C11"
        capacitance="2.2uF"
        footprint="0603"
        pcbX={-14.5}
        pcbY={9.5}
        maxDecouplingTraceLength="5mm"
        connections={{ pin1: ".U1 > .VCAP_1", pin2: "net.GND" }}
      />
      <capacitor
        name="C12"
        capacitance="2.2uF"
        footprint="0603"
        pcbX={-30}
        pcbY={14.5}
        pcbRotation={90}
        maxDecouplingTraceLength="5mm"
        connections={{ pin1: ".U1 > .VCAP_2", pin2: "net.GND" }}
      />
      <pinheader
        name="JPWR"
        pinCount={2}
        pcbX={-39}
        pcbY={-21}
        pinLabels={["V3V3", "GND"]}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <pinheader
        name="JSWD"
        pinCount={5}
        pcbX={-25}
        pcbY={21}
        pinLabels={["VREF", "SWDIO", "SWCLK", "NRST", "GND"]}
        connections={{
          pin1: "net.V3V3",
          pin2: ".U1 > .PA13",
          pin3: ".U1 > .PA14",
          pin4: ".U1 > .NRST",
          pin5: "net.GND",
        }}
      />
      <resistor
        name="R17"
        resistance="10k"
        footprint="0402"
        pcbX={-25}
        pcbY={15}
        connections={{ pin1: ".U1 > .BOOT0", pin2: "net.GND" }}
      />
      <resistor
        name="R18"
        pcbRotation={180}
        resistance="10k"
        footprint="0402"
        pcbX={-27}
        pcbY={-7}
        connections={{ pin1: ".U1 > .PB2", pin2: "net.GND" }}
      />
      <resistor
        name="R19"
        resistance="10k"
        footprint="0402"
        pcbX={-36}
        pcbY={0}
        connections={{ pin1: "net.V3V3", pin2: ".U1 > .NRST" }}
      />
      <capacitor
        name="C13"
        capacitance="100nF"
        footprint="0402"
        pcbX={-39}
        pcbY={0}
        connections={{ pin1: ".U1 > .NRST", pin2: "net.GND" }}
      />
      <resistor
        name="R20"
        resistance="10k"
        footprint="0402"
        pcbX={7}
        pcbY={-19}
        connections={{ pin1: "net.V3V3", pin2: ".U1 > .PD7" }}
      />
      <capacitor
        name="C14"
        capacitance="1uF"
        footprint="0603"
        pcbX={31}
        pcbY={-19}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <silkscreentext
        text="STM32 / 8080 LCD"
        pcbX={12}
        pcbY={23}
        fontSize={1.3}
      />
      <silkscreentext
        text="D0 - D15 / 16-BIT BUS"
        pcbX={17}
        pcbY={19}
        fontSize={0.9}
      />
      <silkscreentext text="3V3 ONLY" pcbX={-35} pcbY={-24} fontSize={0.8} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(phases).toHaveLength(3)
  expect(
    phases.map((phase) => phase.startSimpleRouteJson!.connections.length),
  ).toEqual([16, 16, 17])
  expect(
    phases.map((phase) => phase.endSimpleRouteJson!.traces!.length),
  ).toEqual([16, 32, 95])
  expect(phases[0]!.startSimpleRouteJson!.buses).toMatchObject([
    { maxLengthSkew: 0.1, allowedLayers: ["top"] },
  ])
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  const bus = circuit.db.source_bus.list()[0]!
  const busTraces = circuit.db.pcb_trace
    .list()
    .filter(
      (trace) =>
        trace.source_trace_id &&
        bus.source_trace_ids.includes(trace.source_trace_id),
    )
  expect(busTraces).toHaveLength(16)
  const busVias = busTraces.flatMap((trace) =>
    trace.route.filter((point) => point.route_type === "via"),
  )
  expect(busVias).toHaveLength(4)
  expect(circuit.db.pcb_bus_length_skew_error.list()).toHaveLength(1)
  expect(
    circuit.db.pcb_bus_length_skew_error.list()[0]!.actual_length_skew,
  ).toBeCloseTo(6.878458, 5)
  await expect(phases).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "pipeline9-preserves-bus-lanes",
    circuit,
  )
}, 180_000)
