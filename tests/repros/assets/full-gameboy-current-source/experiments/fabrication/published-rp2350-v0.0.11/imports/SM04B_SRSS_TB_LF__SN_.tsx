import type { ConnectorProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND"],
  pin2: ["V3V3", "VPLUS"],
  pin3: ["SDA"],
  pin4: ["SCL"],
  pin5: ["MP1"],
  pin6: ["MP2"],
} as const

export const SM04B_SRSS_TB_LF__SN_ = (props: ConnectorProps) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C160404"],
      }}
      manufacturerPartNumber="SM04B-SRSS-TB(LF)(SN)"
      pinAttributes={{
        pin1: { requiresGround: true, mustBeConnected: true },
        pin2: {
          requiresPower: true,
          requiresVoltage: "3.3V",
          mustBeConnected: true,
        },
        pin3: {
          capabilities: ["i2c_sda"],
          activeCapability: "i2c_sda",
          mustBeConnected: true,
        },
        pin4: {
          capabilities: ["i2c_scl"],
          activeCapability: "i2c_scl",
          mustBeConnected: true,
        },
        pin5: { doNotConnect: true },
        pin6: { doNotConnect: true },
      }}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.499872mm"
            pcbY="2.0005167mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.49987mm"
            pcbY="2.0005167mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="1.500378mm"
            pcbY="2.0000087mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.50038mm"
            pcbY="2.0000087mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-2.800096mm"
            pcbY="-1.8750153mm"
            width="1.1999976mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="2.800096mm"
            pcbY="-1.8755233mm"
            width="1.1999976mm"
            height="1.7999964mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.019960400000059, y: -2.397467900000038 },
              { x: 1.8800063999999566, y: -2.397467900000038 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.9400266000000101, y: 1.8624676999997973 },
              { x: -3.019958400000064, y: 1.8624676999997973 },
              { x: -3.019958400000064, y: -0.7374763000001394 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.040000999999961, y: 1.8624676999997973 },
              { x: 2.9600143999999773, y: 1.8624676999997973 },
              { x: 2.9600143999999773, y: -0.7443089000000782 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.374392000000057, y: 1.374914699999863 },
              { x: -2.3786501813402765, y: 1.3425706015715377 },
              { x: -2.3911345373397808, y: 1.3124306999998225 },
              { x: -2.4109942797687154, y: 1.286548979768554 },
              { x: -2.4368760000000975, y: 1.2666892373397332 },
              { x: -2.4670159015715853, y: 1.2542048813401152 },
              { x: -2.4993599999999105, y: 1.2499466999997821 },
              { x: -2.5317040984283494, y: 1.2542048813401152 },
              { x: -2.561843999999951, y: 1.2666892373397332 },
              { x: -2.587725720231333, y: 1.286548979768554 },
              { x: -2.6075854626602677, y: 1.3124306999998225 },
              { x: -2.6200698186596583, y: 1.3425706015715377 },
              { x: -2.6243279999999913, y: 1.374914699999863 },
              { x: -2.6200698186596583, y: 1.4072587984283018 },
              { x: -2.6075854626602677, y: 1.4373986999999033 },
              { x: -2.587725720231333, y: 1.4632804202312855 },
              { x: -2.561843999999951, y: 1.4831401626599927 },
              { x: -2.5317040984283494, y: 1.4956245186596107 },
              { x: -2.4993599999999105, y: 1.4998826999999437 },
              { x: -2.4670159015715853, y: 1.4956245186596107 },
              { x: -2.4368760000000975, y: 1.4831401626599927 },
              { x: -2.4109942797687154, y: 1.4632804202312855 },
              { x: -2.3911345373397808, y: 1.4373986999999033 },
              { x: -2.3786501813402765, y: 1.4072587984283018 },
              { x: -2.374392000000057, y: 1.374914699999863 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.000254mm"
            pcbY="3.7879167mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.653346000000056, y: 3.037916699999869 },
              { x: 3.653854000000024, y: 3.037916699999869 },
              { x: 3.653854000000024, y: -3.024683300000106 },
              { x: -3.653346000000056, y: -3.024683300000106 },
              { x: -3.653346000000056, y: 3.037916699999869 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
