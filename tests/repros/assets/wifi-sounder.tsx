// USB-C Wi-Fi 6 sounder. Program the ESP32-C6 through J1, then output
// a 4 kHz square wave on GPIO10 to sound the passive piezo through U3.
export default () => (
  <board schMaxTraceDistance={6.5} isViaInPadAllowed width="48mm" height="44mm">
    <BoardLayout />
    <schematicsheet name="Wi-Fi sounder">
      <net name="VBUS" isPowerNet nominalTraceWidth="0.35mm" />
      <net name="V3V3" isPowerNet nominalTraceWidth="0.35mm" />
      <net name="GND" isGroundNet />
      <schematicsection
        sectionTitleFontSize={0.23}
        name="usb"
        displayName="USB-C interface"
      />
      <schematicsection
        sectionTitleFontSize={0.23}
        name="power"
        displayName="3.3 V supply"
      />
      <schematicsection
        sectionTitleFontSize={0.23}
        name="radio"
        displayName="ESP32-C6 and boot control"
      />
      <schematicsection
        sectionTitleFontSize={0.23}
        name="audio"
        displayName="Piezo driver"
      />
      <UsbPort />
      <PowerSupply />
      <WifiModule />
      {/* Connect the far-side module ground pad to the via array under the shield. */}
      <trace
        name="GND"
        from="U1.GND2"
        to="U1.EP"
        thickness="0.35mm"
        pcbPathRelativeTo="U1"
        pcbPath={["U1.GND2", { x: 4.21, y: 8.255 }, "U1.EP"]}
      />
      <BootCircuit />
      <BuzzerAmplifier />
      <PiezoBuzzer />
      <trace name="AUDIO_IN" from="C6.pin2" to="R7.pin1" />
      <trace name="PIEZO_P" from="R9.pin2" to="Y1.pin1" />
      <trace name="PIEZO_N" from="U3.OUT2" to="Y1.pin2" />
    </schematicsheet>
  </board>
)

function UsbPort() {
  return (
    <>
      {/* USB 2.0 device. Connect both orientations and give each CC its own Rd. */}
      <connector
        name="J1"
        schSectionName="usb"
        schX={-8}
        schY={4}
        manufacturerPartNumber="TYPE-C-31-M-12"
        supplierPartNumbers={{ jlcpcb: ["C165948"] }}
        footprint={usbFootprint}
        cadModel={partModel(
          "C165948",
          "617b05f9bba7410b96c001093d8189e4",
          0,
          -2.75,
          0,
          180,
        )}
        pcbX={-18.35}
        pcbY={-6}
        pcbRotation={270}
        schWidth={1.8}
        pinLabels={{
          pin1: "SHIELD",
          pin2: "SBU2",
          pin3: "CC1",
          pin4: "B7_DM",
          pin5: "A6_DP",
          pin6: "A7_DM",
          pin7: "B6_DP",
          pin8: "SBU1",
          pin9: "CC2",
          pin10: "GND_A",
          pin11: "GND_B",
          pin12: "VBUS_B",
          pin13: "VBUS_A",
        }}
        schPinArrangement={{
          leftSide: {
            pins: [13, 12, 10, 11, 1, 2, 8],
            direction: "top-to-bottom",
          },
          rightSide: { pins: [5, 7, 6, 4, 3, 9], direction: "top-to-bottom" },
        }}
        pinAttributes={{
          VBUS_A: { providesPower: true, providesVoltage: "5V" },
          GND_A: { providesGround: true },
        }}
        noConnect={["SBU1", "SBU2"]}
        connections={{
          VBUS_B: "net.VBUS",
          VBUS_A: "net.VBUS",
          GND_A: "net.GND",
          GND_B: "net.GND",
          SHIELD: "net.GND",
          B7_DM: "net.DM",
          A7_DM: "net.DM",
          B6_DP: "net.DP",
          A6_DP: "net.DP",
        }}
      />
      <resistor
        symbolName="resistor"
        name="R1"
        schSectionName="usb"
        schX={-4.6}
        schY={4.1}
        schRotation={180}
        resistance="22"
        footprint="0603"
        pcbRotation={180}
        pcbX={-13.55}
        pcbY={-3.45}
        connections={{ pin1: "net.USB_DM", pin2: "net.DM" }}
      />
      <resistor
        symbolName="resistor"
        name="R2"
        schSectionName="usb"
        schX={-4.6}
        schY={5.2}
        schRotation={180}
        resistance="22"
        footprint="0603"
        pcbRotation={180}
        pcbX={-13.55}
        pcbY={-5.1}
        connections={{ pin1: "net.USB_DP", pin2: "net.DP" }}
      />
      <resistor
        symbolName="resistor"
        name="R10"
        schSectionName="usb"
        schX={-4}
        schY={2.5}
        schRotation={270}
        resistance="5.1k"
        footprint="0603"
        pcbX={-16}
        pcbY={-13}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        symbolName="resistor"
        name="R11"
        schSectionName="usb"
        schX={-5.8}
        schY={2.5}
        schRotation={270}
        resistance="5.1k"
        footprint="0603"
        pcbX={-18}
        pcbY={0}
        connections={{ pin2: "net.GND" }}
      />
      <trace name="CC1" from="J1.CC1" to="R10.pin1" />
      <trace name="CC2" from="J1.CC2" to="R11.pin1" />
    </>
  )
}

function PowerSupply() {
  return (
    <>
      {/* AP2112K: 600 mA regulator. C1/C2 stabilize the LDO; C3/C4 bypass U1. */}
      <chip
        name="U2"
        schSectionName="power"
        schX={5.5}
        schY={4.7}
        noConnect={["NC"]}
        schPinArrangement={{
          leftSide: { pins: [1, 3], direction: "top-to-bottom" },
          rightSide: { pins: [5, 4], direction: "top-to-bottom" },
          bottomSide: { pins: [2], direction: "left-to-right" },
        }}
        manufacturerPartNumber="AP2112K-3.3TRG1"
        supplierPartNumbers={{ jlcpcb: ["C51118"] }}
        footprint="sot23_5"
        cadModel={partModel(
          "C51118",
          "6d166d1d6c064b99aa79465714e989c1",
          0,
          0,
          -0.15,
          -90,
        )}
        pinLabels={{
          pin1: "VIN",
          pin2: "GND",
          pin3: "EN",
          pin4: "NC",
          pin5: "VOUT",
        }}
        pinAttributes={{
          VIN: { requiresPower: true },
          GND: { requiresGround: true },
          VOUT: { providesPower: true, providesVoltage: "3.3V" },
        }}
        pcbX={-19}
        pcbY={4}
        connections={{
          VIN: "net.VBUS",
          EN: "net.VBUS",
          GND: "net.GND",
          VOUT: "net.V3V3",
        }}
      />
      <capacitor
        name="C1"
        schSectionName="power"
        schX={2.7}
        schY={4}
        schRotation={270}
        capacitance="1uF"
        footprint="0603"
        pcbX={-21.8}
        pcbY={1.1}
        connections={{ pin1: "net.VBUS", pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        schSectionName="power"
        schX={8.3}
        schY={4}
        schRotation={270}
        capacitance="1uF"
        footprint="0603"
        pcbX={-20}
        pcbY={6.6}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <capacitor
        name="C3"
        schSectionName="radio"
        schX={-2.3}
        schY={-1.8}
        schRotation={270}
        capacitance="10uF"
        footprint="0805"
        pcbX={-18.1}
        pcbY={11.8}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <capacitor
        name="C4"
        schSectionName="radio"
        schX={-1.1}
        schY={-1.8}
        schRotation={270}
        capacitance="100nF"
        footprint="0603"
        pcbX={-14.7}
        pcbY={11.8}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
    </>
  )
}

function WifiModule() {
  return (
    <chip
      name="U1"
      schSectionName="radio"
      schX={-4.6}
      schY={-4}
      manufacturerPartNumber="ESP32-C6-WROOM-1-N8"
      supplierPartNumbers={{ jlcpcb: ["C5366877"] }}
      footprint={wifiFootprint}
      pcbX={-2}
      pcbY={5.5}
      cadModel={{
        stepUrl:
          "https://raw.githubusercontent.com/espressif/kicad-libraries/d5b68fd9269c639b3a60681e00b91df33b4db4a3/3dmodels/espressif.3dshapes/ESP32-C6-WROOM-1.STEP",
        modelOriginPosition: { x: 9, y: 9.75, z: 0 },
      }}
      pinLabels={{
        pin1: "GND1",
        pin2: "VDD",
        pin3: "EN",
        pin4: "IO4",
        pin5: "IO5",
        pin6: "IO6",
        pin7: "IO7",
        pin8: "IO0",
        pin9: "IO1",
        pin10: "IO8",
        pin11: "IO10",
        pin12: "IO11",
        pin13: "IO12",
        pin14: "IO13",
        pin15: "IO9",
        pin16: "IO18",
        pin17: "IO19",
        pin18: "IO20",
        pin19: "IO21",
        pin20: "IO22",
        pin21: "IO23",
        pin22: "NC",
        pin23: "IO15",
        pin24: "RXD0",
        pin25: "TXD0",
        pin26: "IO3",
        pin27: "IO2",
        pin28: "GND2",
        pin29: "EP",
      }}
      // The schematic shows the board connections. The footprint retains all 29 pins.
      schPinArrangement={{
        leftSide: { pins: [3, 15, 10, 13, 14], direction: "top-to-bottom" },
        rightSide: { pins: [11, 1, 28, 29], direction: "top-to-bottom" },
        topSide: { pins: [2], direction: "left-to-right" },
      }}
      internallyConnectedPins={[["GND1", "GND2", "EP"]]}
      noConnect={["NC"]}
      pinAttributes={{
        VDD: { requiresPower: true, requiresVoltage: "3.3V" },
        GND1: { requiresGround: true },
        GND2: { requiresGround: true },
        EP: { requiresGround: true },
        IO10: { isGpio: true },
      }}
      connections={{
        VDD: "net.V3V3",
        GND1: "net.GND",
        EP: "net.GND",
        EN: "net.CHIP_EN",
        IO9: "net.BOOT",
        IO8: "net.STRAP8",
        IO12: "net.USB_DM",
        IO13: "net.USB_DP",
        IO10: "net.TONE",
      }}
    />
  )
}

function BootCircuit() {
  return (
    <>
      {/* Power-on reset and boot straps. Hold BOOT while plugging in USB for the ROM loader. */}
      <resistor
        symbolName="resistor"
        name="R3"
        schSectionName="radio"
        schX={-10}
        schY={-2.5}
        schRotation={270}
        resistance="10k"
        footprint="0603"
        pcbX={-15.5}
        pcbY={8.5}
        connections={{ pin1: "net.V3V3", pin2: "net.CHIP_EN" }}
      />
      <capacitor
        name="C5"
        schSectionName="radio"
        schX={-10}
        schY={-5.5}
        schRotation={270}
        capacitance="1uF"
        footprint="0603"
        pcbX={-15.5}
        pcbY={6.5}
        connections={{ pin1: "net.CHIP_EN", pin2: "net.GND" }}
      />
      <resistor
        symbolName="resistor"
        name="R4"
        schSectionName="radio"
        schX={-8.2}
        schY={-2.5}
        schRotation={270}
        resistance="10k"
        footprint="0603"
        pcbX={9.7}
        pcbY={-2.9}
        connections={{ pin1: "net.V3V3", pin2: "net.BOOT" }}
      />
      <resistor
        symbolName="resistor"
        name="R5"
        schSectionName="radio"
        schX={-7.2}
        schY={-2.5}
        schRotation={270}
        resistance="10k"
        footprint="0603"
        pcbX={-14.8}
        pcbY={3.1}
        connections={{ pin1: "net.V3V3", pin2: "net.STRAP8" }}
      />
      <pushbutton
        name="SW1"
        schSectionName="radio"
        schX={-8.2}
        schY={-5.5}
        schRotation={270}
        manufacturerPartNumber="HX-3x4x2-2P-1.6N"
        supplierPartNumbers={{ jlcpcb: ["C49234124"] }}
        footprint={bootFootprint}
        cadModel={partModel(
          "C49234124",
          "167cb812923f4f7cbb49e982a3bb3b9d",
          0,
          0,
          -0.01,
        )}
        pcbX={12}
        pcbY={4}
        connections={{ pin1: "net.BOOT", pin2: "net.GND" }}
      />
    </>
  )
}

function BuzzerAmplifier() {
  return (
    <>
      {/* LM4861 bridge amplifier. Differential gain = 2 × R8/R7 = 2.
          C6 blocks GPIO DC. R9 isolates the capacitive load from the output. */}
      <chip
        name="U3"
        schSectionName="audio"
        schX={5.3}
        schY={-4.3}
        schWidth={1.7}
        schPinArrangement={{
          leftSide: { pins: [4, 3, 2], direction: "top-to-bottom" },
          rightSide: { pins: [5, 8], direction: "top-to-bottom" },
          bottomSide: { pins: [1, 7, 6], direction: "left-to-right" },
        }}
        manufacturerPartNumber="LM4861MX/NOPB"
        supplierPartNumbers={{ jlcpcb: ["C7958"] }}
        footprint="soic8_w7mm_pl1.8mm_pw0.59mm_p1.27mm_widthincludeslegs"
        cadModel={partModel(
          "C7958",
          "ec3b9f9b31a74655be3e55848dbee9c1",
          0,
          0,
          0,
          -90,
        )}
        pcbX={1}
        pcbY={-9.5}
        pinLabels={{
          pin1: "SHDN",
          pin2: "BYP",
          pin3: "IN_P",
          pin4: "IN_N",
          pin5: "OUT1",
          pin6: "VDD",
          pin7: "GND",
          pin8: "OUT2",
        }}
        pinAttributes={{
          VDD: { requiresPower: true },
          GND: { requiresGround: true },
        }}
        connections={{
          VDD: "net.VBUS",
          GND: "net.GND",
          SHDN: "net.GND",
          IN_N: "net.SUM",
          OUT1: "net.OUT1",
          BYP: "net.BIAS",
          IN_P: "net.BIAS",
        }}
      />
      <capacitor
        name="C6"
        schSectionName="audio"
        schX={1}
        schY={-4.1}
        connections={{ pin1: "net.TONE" }}
        capacitance="330nF"
        footprint="0603"
        pcbX={-10.5}
        pcbY={-7.8}
      />
      <resistor
        symbolName="resistor"
        name="R7"
        connections={{ pin2: "net.SUM" }}
        schSectionName="audio"
        schX={2.6}
        schY={-4.1}
        resistance="20k"
        footprint="0603"
        pcbX={-3}
        pcbY={-14.8}
      />
      <resistor
        symbolName="resistor"
        name="R8"
        connections={{ pin1: "net.SUM", pin2: "net.OUT1" }}
        schSectionName="audio"
        schX={5.3}
        schY={-2.2}
        resistance="20k"
        footprint="0603"
        pcbX={6.8}
        pcbY={-10.5}
        pcbRotation={90}
      />
      <capacitor
        name="C7"
        schSectionName="audio"
        schX={3.3}
        schY={-5.8}
        schRotation={270}
        capacitance="1uF"
        footprint="0603"
        pcbX={0.6}
        pcbY={-14.7}
        connections={{ pin1: "net.BIAS", pin2: "net.GND" }}
      />
      <capacitor
        name="C8"
        schSectionName="audio"
        schX={7.8}
        schY={-6.65}
        schRotation={270}
        capacitance="100nF"
        footprint="0603"
        pcbX={4.5}
        pcbY={-6}
        connections={{ pin1: "net.VBUS", pin2: "net.GND" }}
      />
      <resistor
        symbolName="resistor"
        name="R9"
        connections={{ pin1: "net.OUT1" }}
        schSectionName="audio"
        schX={8.1}
        schY={-3.8}
        resistance="100"
        footprint="0603"
        pcbX={8.3}
        pcbY={-6.4}
      />
    </>
  )
}

function BoardLayout() {
  return (
    <>
      <keepout
        shape="rect"
        pcbX={0}
        pcbY={18.625}
        width={48}
        height={6.75}
        excludeRefs={[".U1"]}
        layers={["top", "bottom"]}
      />
      <copperpour
        layer="bottom"
        connectsTo="net.GND"
        clearance="0.25mm"
        coveredWithSolderMask
      />
      <silkscreentext
        text="Wi-Fi Sounder"
        pcbX={-15}
        pcbY={-18.6}
        fontSize={1.5}
      />
      <silkscreentext text="BOOT" pcbX={12} pcbY={1.2} fontSize={0.9} />
      <silkscreentext text="USB-C" pcbX={-20} pcbY={-12.2} fontSize={0.9} />
      <silkscreentext text="PIEZO" pcbX={15} pcbY={-16} fontSize={0.9} />
    </>
  )
}

// Manufacturer land patterns. All dimensions are in mm.
function partModel(
  part: string,
  uuid: string,
  x: number,
  y: number,
  z: number,
  rotation = 0,
) {
  const base = "https://modelcdn.tscircuit.com/easyeda_models/assets/" + part
  return {
    objUrl: base + ".obj?uuid=" + uuid,
    stepUrl: base + ".step?uuid=" + uuid,
    pcbRotationOffset: rotation,
    modelOriginPosition: { x, y, z },
  }
}
function CastellatedPad({ pin }: { pin: number }) {
  const left = pin <= 14
  return (
    <smtpad
      portHints={["pin" + pin]}
      shape="rect"
      width={1.5}
      height={0.9}
      pcbX={left ? -8.75 : 8.75}
      pcbY={left ? 8.255 - (pin - 1) * 1.27 : -8.255 + (pin - 15) * 1.27}
    />
  )
}

const usbFootprint = (
  <footprint insertionDirection="from_bottom">
    <hole pcbX={-2.9} pcbY={0.906} diameter={0.6} />
    <hole pcbX={2.9} pcbY={0.906} diameter={0.6} />
    {[-4.325, 4.325].map((x) => (
      <UsbShellTabs key={x} x={x} />
    ))}
    {[
      -1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75, -3.2, 3.2, 2.4, -2.4,
    ].map((x, i) => (
      <UsbContact key={i} pin={i + 2} x={x} />
    ))}
    <courtyardrect width={10.35} height={8.674} pcbY={-1.263} />
  </footprint>
)
function UsbShellTabs({ x }: { x: number }) {
  return (
    <>
      <platedhole
        portHints={["pin1"]}
        pcbX={x}
        pcbY={1.406}
        shape="pill"
        holeWidth={0.8}
        holeHeight={1.5}
        outerWidth={1.2}
        outerHeight={2}
      />
      <platedhole
        portHints={["pin1"]}
        pcbX={x}
        pcbY={-2.774}
        shape="pill"
        holeWidth={0.8}
        holeHeight={1.2}
        outerWidth={1.2}
        outerHeight={1.8}
      />
    </>
  )
}
function UsbContact({ pin, x }: { pin: number; x: number }) {
  return (
    <smtpad
      portHints={["pin" + pin]}
      shape="rect"
      pcbX={x}
      pcbY={2.174}
      width={pin < 10 ? 0.3 : 0.6}
      height={1.3}
    />
  )
}

const wifiFootprint = (
  <footprint>
    {Array.from({ length: 28 }, (_, i) => (
      <CastellatedPad key={i} pin={i + 1} />
    ))}
    {/* Espressif splits exposed pad 29 into nine grounded lands. */}
    {Array.from({ length: 9 }, (_, i) => (
      <ExposedGroundPad
        key={i}
        x={-2.755 + 1.25 * (i % 3)}
        y={1.29 + 1.25 * Math.floor(i / 3)}
      />
    ))}
    <silkscreenrect pcbY={3} width={18} height={25.5} />
    <courtyardrect pcbY={3} width={19.5} height={26.1} />
  </footprint>
)
function ExposedGroundPad({ x, y }: { x: number; y: number }) {
  return (
    <>
      <smtpad
        portHints={["pin29"]}
        shape="rect"
        pcbX={x}
        pcbY={y}
        width={0.8}
        height={0.8}
      />
      <via
        connectsTo="net.GND"
        pcbX={x}
        pcbY={y}
        holeDiameter={0.3}
        outerDiameter={0.6}
        tented="bottom_tented"
      />
    </>
  )
}
const buzzerFootprint = (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX={-4}
      width={1.6}
      height={3.8}
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX={4}
      width={1.6}
      height={3.8}
      shape="rect"
    />
    <silkscreenrect width={9} height={9} />
    <courtyardrect width={10.1} height={9.5} />
  </footprint>
)
const bootFootprint = (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      pcbX={-2.16}
      width={1.3}
      height={1.7}
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX={2.16}
      width={1.3}
      height={1.7}
      shape="rect"
    />
    <courtyardrect width={6.12} height={3.55} />
  </footprint>
)

// The piezo presents 12 nF at its terminals (CPT-9019S-SMT-TR datasheet).
function PiezoBuzzer() {
  return (
    <resonator
      name="Y1"
      schSectionName="audio"
      schX={10}
      schY={-4.1}
      frequency="4kHz"
      pinVariant="no_ground"
      manufacturerPartNumber="CPT-9019S-SMT-TR"
      supplierPartNumbers={{ jlcpcb: ["C95163"] }}
      loadCapacitance="12nF"
      displayName="4 kHz piezo"
      footprint={buzzerFootprint}
      cadModel={partModel(
        "C95163",
        "d00722379e0c4827877668a7a84ec15f",
        0,
        0,
        0,
        180,
      )}
      pcbX={15}
      pcbY={-10}
      symbol={
        <symbol>
          <port
            pinNumber={1}
            name="pin1"
            direction="left"
            schX={-0.55}
            schY={0.3}
            schStemLength={0.35}
          />
          <port
            pinNumber={2}
            name="pin2"
            direction="left"
            schX={-0.55}
            schY={-0.3}
            schStemLength={0.35}
          />
          <schematicpath
            points={[
              { x: -0.2, y: -0.35 },
              { x: -0.2, y: 0.35 },
              { x: 0.1, y: 0.35 },
              { x: 0.4, y: 0.45 },
              { x: 0.4, y: -0.45 },
              { x: 0.1, y: -0.35 },
              { x: -0.2, y: -0.35 },
            ]}
          />
          <schematictext
            text="{NAME}"
            schX={0}
            schY={0.6}
            anchor="bottom_center"
            fontSize={0.18}
          />
          <schematictext
            text="4 kHz piezo"
            schX={0}
            schY={-0.65}
            anchor="top_center"
            fontSize={0.18}
          />
        </symbol>
      }
    />
  )
}
