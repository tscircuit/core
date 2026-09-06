import type { ConnectorProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND"],
  pin2: ["V3V3", "VPLUS"],
  pin3: ["SCK"],
  pin4: ["MOSI"],
  pin5: ["MISO"],
  pin6: ["CS"],
  pin7: ["MP1"],
  pin8: ["MP2"],
} as const

export const SM06B_SRSS_TB_LF__SN_ = (props: ConnectorProps) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C160405"],
      }}
      manufacturerPartNumber="SM06B-SRSS-TB(LF)(SN)"
      pinAttributes={{
        pin1: { requiresGround: true, mustBeConnected: true },
        pin2: {
          requiresPower: true,
          requiresVoltage: "3.3V",
          mustBeConnected: true,
        },
        pin3: {
          capabilities: ["spi_sck"],
          activeCapability: "spi_sck",
          mustBeConnected: true,
        },
        pin4: {
          capabilities: ["spi_mosi"],
          activeCapability: "spi_mosi",
          mustBeConnected: true,
        },
        pin5: {
          capabilities: ["spi_miso"],
          activeCapability: "spi_miso",
          mustBeConnected: true,
        },
        pin6: {
          capabilities: ["spi_cs"],
          activeCapability: "spi_cs",
          mustBeConnected: true,
        },
        pin7: { doNotConnect: true },
        pin8: { doNotConnect: true },
      }}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.499995mm"
            pcbY="2.0500086mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.499743mm"
            pcbY="2.0500086mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.499745mm"
            pcbY="2.0500086mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.500253mm"
            pcbY="2.0500086mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="1.500251mm"
            pcbY="2.0500086mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="2.500249mm"
            pcbY="2.0500086mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="3.799967mm"
            pcbY="-1.8250154mm"
            width="1.499997mm"
            height="1.999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-3.799967mm"
            pcbY="-1.8250154mm"
            width="1.499997mm"
            height="1.999996mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -3.9998904000000266, y: 1.725015600000006 },
              { x: -3.0310073999999076, y: 1.725015600000006 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.0312613999999485, y: 1.725015600000006 },
              { x: 4.000068199999987, y: 1.725015600000006 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.000068199999987, y: 1.725015600000006 },
              { x: 4.000068199999987, y: -0.5938519999999698 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.9998904000000266, y: 1.725015600000006 },
              { x: -3.9998904000000266, y: -0.5938519999999698 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.818714200000045, y: -2.524963200000002 },
              { x: 2.8188920000000053, y: -2.524963200000002 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.002921mm"
            pcbY="4.1676086mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -4.793678999999997, y: 3.417608599999994 },
              { x: 4.799521000000141, y: 3.417608599999994 },
              { x: 4.799521000000141, y: -3.0767913999999337 },
              { x: -4.793678999999997, y: -3.0767913999999337 },
              { x: -4.793678999999997, y: 3.417608599999994 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
