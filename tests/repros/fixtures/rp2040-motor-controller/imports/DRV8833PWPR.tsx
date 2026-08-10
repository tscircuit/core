import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["nSleep"],
  pin2: ["AOUT1"],
  pin3: ["AISEN"],
  pin4: ["AOUT2"],
  pin5: ["BOUT2"],
  pin6: ["BISEN"],
  pin7: ["BOUT1"],
  pin8: ["nFault"],
  pin9: ["BIN1"],
  pin10: ["BIN2"],
  pin11: ["VCP"],
  pin12: ["VM"],
  pin13: ["GND1"],
  pin14: ["VINT"],
  pin15: ["AIN2"],
  pin16: ["AIN1"],
  pin17: ["GND2"],
} as const

export const DRV8833PWPR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={{
        VM: { requiresPower: true },
        GND1: { requiresGround: true },
        GND2: { requiresGround: true },
        nFault: { canUseOpenDrain: true, needsExternalPullup: true },
        nSleep: { needsExternalPulldown: true },
      }}
      supplierPartNumbers={{
        jlcpcb: ["C50506"],
      }}
      manufacturerPartNumber="DRV8833PWPR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.275078mm"
            pcbY="-2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.625092mm"
            pcbY="-2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.975106mm"
            pcbY="-2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.324866mm"
            pcbY="-2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.32512mm"
            pcbY="-2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.975106mm"
            pcbY="-2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.625092mm"
            pcbY="-2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="2.275078mm"
            pcbY="-2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-2.275078mm"
            pcbY="2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-1.625092mm"
            pcbY="2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-0.975106mm"
            pcbY="2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-0.324866mm"
            pcbY="2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="0.32512mm"
            pcbY="2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="0.975106mm"
            pcbY="2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.625092mm"
            pcbY="2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="2.275078mm"
            pcbY="2.850007mm"
            width="0.350012mm"
            height="1.2999974mm"
            radius="0.175006mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="0mm"
            pcbY="0mm"
            width="2.7399996mm"
            height="2.7399996mm"
            shape="rect"
          />
          <platedhole
            portHints={["pin17"]}
            pcbX="0.500126mm"
            pcbY="0.499872mm"
            outerDiameter="0.6096mm"
            holeDiameter="0.3048mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin17"]}
            pcbX="-0.499872mm"
            pcbY="0.499872mm"
            outerDiameter="0.6096mm"
            holeDiameter="0.3048mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin17"]}
            pcbX="-0.499872mm"
            pcbY="-0.500126mm"
            outerDiameter="0.6096mm"
            holeDiameter="0.3048mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin17"]}
            pcbX="0.500126mm"
            pcbY="-0.500126mm"
            outerDiameter="0.6096mm"
            holeDiameter="0.3048mm"
            shape="circle"
          />
          <silkscreenpath
            route={[
              { x: 2.499994999999899, y: 2.100910200000044 },
              { x: 2.499994999999899, y: -2.1009101999999302 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5400000000000773, y: -2.1397722000000385 },
              { x: -2.5400000000000773, y: -0.3810000000000855 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5400000000000773, y: 2.1397722000000385 },
              { x: -2.5400000000000773, y: 0.3809999999999718 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.9337273999999525, y: -2.1999955999999656 },
              { x: 1.9664425999999366, y: -2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2837413999998262, y: -2.1999955999999656 },
              { x: 1.3164565999998104, y: -2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.6337554000000409, y: -2.1999955999999656 },
              { x: 0.6664706000000251, y: -2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.01623060000008536, y: -2.1999955999999656 },
              { x: 0.01648459999989882, y: -2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6664706000000251, y: -2.1999955999999656 },
              { x: -0.6335014000000001, y: -2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.316456599999924, y: -2.1999955999999656 },
              { x: -1.2837413999999399, y: -2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.9664426000000503, y: -2.1999955999999656 },
              { x: -1.9337274000000662, y: -2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.9337273999999525, y: 2.1999955999999656 },
              { x: 1.9664425999999366, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2837413999998262, y: 2.1999955999999656 },
              { x: 1.3164565999998104, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.6337554000000409, y: 2.1999955999999656 },
              { x: 0.6664706000000251, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.01623060000008536, y: 2.1999955999999656 },
              { x: 0.01648459999989882, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6664706000000251, y: 2.1999955999999656 },
              { x: -0.6335014000000001, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.316456599999924, y: 2.1999955999999656 },
              { x: -1.2837413999999399, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.9664426000000503, y: 2.1999955999999656 },
              { x: -1.9337274000000662, y: 2.1999955999999656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.8818860000001223, y: -1.6509999999999536 },
              { x: -1.887001010512563, y: -1.6898523621364347 },
              { x: -1.9019974625363147, y: -1.7260570000000826 },
              { x: -1.9258533726489304, y: -1.7571466273510623 },
              { x: -1.9569430000000239, y: -1.781002537463678 },
              { x: -1.993147637863558, y: -1.7959989894875434 },
              { x: -2.032000000000039, y: -1.8011139999998704 },
              { x: -2.070852362136634, y: -1.7959989894875434 },
              { x: -2.107057000000168, y: -1.781002537463678 },
              { x: -2.138146627351034, y: -1.7571466273510623 },
              { x: -2.16200253746365, y: -1.7260570000000826 },
              { x: -2.176998989487629, y: -1.6898523621364347 },
              { x: -2.1821140000000696, y: -1.6509999999999536 },
              { x: -2.176998989487629, y: -1.6121476378633588 },
              { x: -2.16200253746365, y: -1.5759429999998247 },
              { x: -2.138146627351034, y: -1.5448533726489586 },
              { x: -2.107057000000168, y: -1.520997462536343 },
              { x: -2.070852362136634, y: -1.5060010105123638 },
              { x: -2.032000000000039, y: -1.5008860000000368 },
              { x: -1.993147637863558, y: -1.5060010105123638 },
              { x: -1.9569430000000239, y: -1.520997462536343 },
              { x: -1.9258533726489304, y: -1.5448533726489586 },
              { x: -1.9019974625363147, y: -1.5759429999998247 },
              { x: -1.887001010512563, y: -1.6121476378633588 },
              { x: -1.8818860000001223, y: -1.6509999999999536 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.7487879999999905, y: -2.8595319999999447 },
              { x: -2.753903010512545, y: -2.898384362136426 },
              { x: -2.7688994625364103, y: -2.93458899999996 },
              { x: -2.792755372649026, y: -2.9656786273510534 },
              { x: -2.8238450000000057, y: -2.989534537463669 },
              { x: -2.860049637863426, y: -3.004530989487421 },
              { x: -2.8989020000001346, y: -3.0096459999998615 },
              { x: -2.937754362136502, y: -3.004530989487421 },
              { x: -2.973959000000036, y: -2.989534537463669 },
              { x: -3.0050486273511297, y: -2.9656786273510534 },
              { x: -3.0289045374637453, y: -2.93458899999996 },
              { x: -3.043900989487497, y: -2.898384362136426 },
              { x: -3.0490159999999378, y: -2.8595319999999447 },
              { x: -3.043900989487497, y: -2.82067963786335 },
              { x: -3.0289045374637453, y: -2.7844749999999294 },
              { x: -3.0050486273511297, y: -2.753385372648836 },
              { x: -2.973959000000036, y: -2.7295294625362203 },
              { x: -2.937754362136502, y: -2.7145330105124685 },
              { x: -2.8989020000001346, y: -2.709417999999914 },
              { x: -2.860049637863426, y: -2.7145330105124685 },
              { x: -2.8238450000000057, y: -2.7295294625362203 },
              { x: -2.792755372649026, y: -2.753385372648836 },
              { x: -2.7688994625364103, y: -2.7844749999999294 },
              { x: -2.753903010512545, y: -2.82067963786335 },
              { x: -2.7487879999999905, y: -2.8595319999999447 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5400000000000773, y: -0.3810000000000855 },
              { x: -2.7639461811234014, y: -0.308235474856815 },
              { x: -2.902352532708619, y: -0.11773547485677227 },
              { x: -2.902352532708619, y: 0.11773547485688596 },
              { x: -2.7639461811234014, y: 0.3082354748569287 },
              { x: -2.5400000000000773, y: 0.3809999999999718 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.2794mm"
            pcbY="4.3274mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.298000000000002, y: 3.5774000000000115 },
              { x: 2.7392000000000962, y: 3.5774000000000115 },
              { x: 2.7392000000000962, y: -3.983799999999974 },
              { x: -3.298000000000002, y: -3.983799999999974 },
              { x: -3.298000000000002, y: 3.5774000000000115 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C50506.obj?uuid=534f03d8fe164fbab551f91e5a792e30",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C50506.step?uuid=534f03d8fe164fbab551f91e5a792e30",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: -0.019205 },
      }}
      {...props}
    />
  )
}
