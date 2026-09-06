import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
} as const

export const SRV05_4_P_T7 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={{
        pin2: { requiresGround: true },
        pin5: { requiresPower: true },
      }}
      symbol={
        <symbol>
          <schematicrect
            schX={0}
            schY={-0.05}
            width={1.8}
            height={2.9}
            color="#880000"
            isFilled
            fillColor="#FFFFFF"
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["1"]}
            direction="right"
            schX={1.3}
            schY={-0.9}
            schStemLength={0.4}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["2"]}
            direction="right"
            schX={1.3}
            schY={-0.1}
            schStemLength={0.4}
          />
          <port
            name="pin3"
            pinNumber={3}
            aliases={["3"]}
            direction="right"
            schX={1.3}
            schY={0.7}
            schStemLength={0.4}
          />
          <port
            name="pin4"
            pinNumber={4}
            aliases={["4"]}
            direction="left"
            schX={-1.3}
            schY={0.7}
            schStemLength={0.4}
          />
          <port
            name="pin5"
            pinNumber={5}
            aliases={["5"]}
            direction="left"
            schX={-1.3}
            schY={-0.1}
            schStemLength={0.4}
          />
          <schematicpath
            points={[
              { x: 0.7, y: -1.2 },
              { x: -0.7, y: -1.2 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.7, y: -0.5 },
              { x: -0.1, y: -0.5 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.5, y: -1 },
              { x: 0.3, y: -1.2 },
              { x: 0.5, y: -1.4 },
              { x: 0.5, y: -1 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.3, y: -1.4 },
              { x: 0.3, y: -1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.3, y: -1 },
              { x: -0.5, y: -1.2 },
              { x: -0.3, y: -1.4 },
              { x: -0.3, y: -1 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.5, y: -1.4 },
              { x: -0.5, y: -1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.1, y: 0.1 },
              { x: -0.1, y: -0.1 },
              { x: 0.1, y: -0.3 },
              { x: 0.1, y: 0.1 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.1, y: -0.3 },
              { x: -0.1, y: 0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.1, y: 0.1 },
              { x: -0.04, y: 0.1 },
            ]}
            strokeColor="#880000"
          />
          <port
            name="pin6"
            pinNumber={6}
            aliases={["6"]}
            direction="left"
            schX={-1.3}
            schY={-0.9}
            schStemLength={0.4}
          />
          <schematicpath
            points={[
              { x: -0.1, y: -0.5 },
              { x: -0.7, y: -0.5 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.3, y: -0.32 },
              { x: -0.5, y: -0.52 },
              { x: -0.3, y: -0.72 },
              { x: -0.3, y: -0.32 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.5, y: -0.72 },
              { x: -0.5, y: -0.32 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.5, y: -0.3 },
              { x: 0.3, y: -0.5 },
              { x: 0.5, y: -0.7 },
              { x: 0.5, y: -0.3 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.3, y: -0.7 },
              { x: 0.3, y: -0.3 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.16, y: -0.3 },
              { x: -0.1, y: -0.3 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.1, y: -0.5 },
              { x: -0.1, y: -0.9 },
              { x: -0.9, y: -0.9 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.1, y: -1.2 },
              { x: 0.1, y: -0.9 },
              { x: 0.9, y: -0.9 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.7, y: -1.2 },
              { x: 0.7, y: 0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.7, y: -1.2 },
              { x: -0.7, y: 0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.2, y: 0.7 },
              { x: -0.2, y: 0.7 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.9, y: -0.1 },
              { x: 0.1, y: -0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.1, y: -0.1 },
              { x: -0.7, y: -0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.08 -1.2 A 0.02 0.02 0 1 1 0.08 -1.2"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M -0.12 -0.5 A 0.02 0.02 0 1 1 -0.12 -0.5"
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.5, y: 0.5 },
              { x: 0.3, y: 0.3 },
              { x: 0.5, y: 0.1 },
              { x: 0.5, y: 0.5 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.3, y: 0.1 },
              { x: 0.3, y: 0.5 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.3, y: 0.5 },
              { x: -0.5, y: 0.3 },
              { x: -0.3, y: 0.1 },
              { x: -0.3, y: 0.5 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.5, y: 0.1 },
              { x: -0.5, y: 0.5 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.3, y: 1.3 },
              { x: -0.5, y: 1.1 },
              { x: -0.3, y: 0.9 },
              { x: -0.3, y: 1.3 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.5, y: 0.9 },
              { x: -0.5, y: 1.3 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.5, y: 1.32 },
              { x: 0.3, y: 1.12 },
              { x: 0.5, y: 0.92 },
              { x: 0.5, y: 1.32 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.3, y: 0.92 },
              { x: 0.3, y: 1.32 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.3, y: 0.3 },
              { x: -0.3, y: 0.3 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.5, y: 0.3 },
              { x: 0.7, y: 0.3 },
              { x: 0.7, y: 0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.5, y: 0.3 },
              { x: -0.7, y: 0.3 },
              { x: -0.7, y: 0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.7, y: 0.3 },
              { x: 0.7, y: 1.1 },
              { x: 0.5, y: 1.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.3, y: 1.1 },
              { x: -0.3, y: 1.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.5, y: 1.1 },
              { x: -0.7, y: 1.1 },
              { x: -0.7, y: 0.3 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.7, y: -0.1 },
              { x: -0.9, y: -0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematiccircle
            center={{ x: 0.7, y: -0.5 }}
            radius={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: -0.7, y: -0.5 }}
            radius={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: 0.7, y: 0.3 }}
            radius={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: -0.7, y: 0.3 }}
            radius={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: 0.1, y: 0.3 }}
            radius={0.02}
            color="#880000"
          />
          <schematicpath
            points={[
              { x: 0.1, y: 0.3 },
              { x: 0.1, y: 0.7 },
              { x: 0.9, y: 0.7 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.1, y: 1.1 },
              { x: -0.1, y: 0.7 },
              { x: -0.7, y: 0.7 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.7, y: 0.7 },
              { x: -0.9, y: 0.7 },
            ]}
            strokeColor="#880000"
          />
          <schematiccircle
            center={{ x: -0.1, y: 1.1 }}
            radius={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: 0.1, y: -1.2 }}
            radius={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: -0.1, y: -0.5 }}
            radius={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: 0.7, y: -0.1 }}
            radius={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: -0.7, y: -0.1 }}
            radius={0.02}
            color="#880000"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C85364"],
      }}
      manufacturerPartNumber="SRV05-4-P-T7"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin3"]}
            pcbX="1.35001mm"
            pcbY="0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.35001mm"
            pcbY="-0mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="1.35001mm"
            pcbY="-0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-1.35001mm"
            pcbY="-0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-1.35001mm"
            pcbY="-0mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.35001mm"
            pcbY="0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.899998200000141, y: 1.5499080000000731 },
              { x: 0.9000236000000541, y: 1.5499080000000731 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.899998200000141, y: -1.5501111999999466 },
              { x: 0.9000236000000541, y: -1.5501111999999466 },
            ]}
          />
          <silkscreencircle pcbX="1.397mm" pcbY="-1.651mm" radius="0.127mm" />
          <silkscreentext
            text="{NAME}"
            pcbX="0.012446mm"
            pcbY="2.562354mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.1425540000000183, y: 1.8123540000000276 },
              { x: 2.167445999999927, y: 1.8123540000000276 },
              { x: 2.167445999999927, y: -2.015045999999984 },
              { x: -2.1425540000000183, y: -2.015045999999984 },
              { x: -2.1425540000000183, y: 1.8123540000000276 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
