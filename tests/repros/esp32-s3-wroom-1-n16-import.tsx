// JLCEDA/EasyEDA Official Library: https://lceda.cn/ and https://easyeda.com
// C2913199 full symbol and footprint from normal import; only external 3D model references omitted.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND1"],
  pin2: ["3V3"],
  pin3: ["EN"],
  pin4: ["IO4"],
  pin5: ["IO5"],
  pin6: ["IO6"],
  pin7: ["IO7"],
  pin8: ["IO15"],
  pin9: ["IO16"],
  pin10: ["IO17"],
  pin11: ["IO18"],
  pin12: ["IO8"],
  pin13: ["IO19"],
  pin14: ["IO20"],
  pin15: ["IO3"],
  pin16: ["IO46"],
  pin17: ["IO9"],
  pin18: ["IO10"],
  pin19: ["IO11"],
  pin20: ["IO12"],
  pin21: ["IO13"],
  pin22: ["IO14"],
  pin23: ["IO21"],
  pin24: ["IO47"],
  pin25: ["IO48"],
  pin26: ["IO45"],
  pin27: ["IO0"],
  pin28: ["IO35"],
  pin29: ["IO36"],
  pin30: ["IO37"],
  pin31: ["IO38"],
  pin32: ["IO39"],
  pin33: ["IO40"],
  pin34: ["IO41"],
  pin35: ["IO42"],
  pin36: ["RXD0"],
  pin37: ["TXD0"],
  pin38: ["IO2"],
  pin39: ["IO1"],
  pin40: ["GND2"],
  pin41: ["GND3"],
} as const

const pinAttributes = {
  pin1: { requiresGround: true },
  pin40: { requiresGround: true },
  pin41: { requiresGround: true },
} as const

export const ESP32_S3_WROOM_1_N16 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      symbol={
        <symbol>
          <schematicrect
            schX={0}
            schY={0.15}
            width={3.2}
            height={5.5}
            strokeWidth={0.02}
            color="#880000"
          />
          <schematiccircle
            center={{ x: -1.5, y: 1 }}
            radius={0.03}
            strokeWidth={0.02}
            color="#880000"
            isFilled
            fillColor="#880000"
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["GND1"]}
            direction="left"
            schX={-1.8}
            schY={0.8}
            schStemLength={0.2}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["3V3"]}
            direction="left"
            schX={-1.8}
            schY={0.6}
            schStemLength={0.2}
          />
          <port
            name="pin3"
            pinNumber={3}
            aliases={["EN"]}
            direction="left"
            schX={-1.8}
            schY={0.4}
            schStemLength={0.2}
          />
          <port
            name="pin4"
            pinNumber={4}
            aliases={["IO4"]}
            direction="left"
            schX={-1.8}
            schY={0.2}
            schStemLength={0.2}
          />
          <port
            name="pin5"
            pinNumber={5}
            aliases={["IO5"]}
            direction="left"
            schX={-1.8}
            schY={0}
            schStemLength={0.2}
          />
          <port
            name="pin6"
            pinNumber={6}
            aliases={["IO6"]}
            direction="left"
            schX={-1.8}
            schY={-0.2}
            schStemLength={0.2}
          />
          <port
            name="pin7"
            pinNumber={7}
            aliases={["IO7"]}
            direction="left"
            schX={-1.8}
            schY={-0.4}
            schStemLength={0.2}
          />
          <port
            name="pin8"
            pinNumber={8}
            aliases={["IO15"]}
            direction="left"
            schX={-1.8}
            schY={-0.6}
            schStemLength={0.2}
          />
          <port
            name="pin9"
            pinNumber={9}
            aliases={["IO16"]}
            direction="left"
            schX={-1.8}
            schY={-0.8}
            schStemLength={0.2}
          />
          <port
            name="pin10"
            pinNumber={10}
            aliases={["IO17"]}
            direction="left"
            schX={-1.8}
            schY={-1}
            schStemLength={0.2}
          />
          <port
            name="pin11"
            pinNumber={11}
            aliases={["IO18"]}
            direction="left"
            schX={-1.8}
            schY={-1.2}
            schStemLength={0.2}
          />
          <port
            name="pin12"
            pinNumber={12}
            aliases={["IO8"]}
            direction="left"
            schX={-1.8}
            schY={-1.4}
            schStemLength={0.2}
          />
          <port
            name="pin13"
            pinNumber={13}
            aliases={["IO19"]}
            direction="left"
            schX={-1.8}
            schY={-1.6}
            schStemLength={0.2}
          />
          <port
            name="pin14"
            pinNumber={14}
            aliases={["IO20"]}
            direction="left"
            schX={-1.8}
            schY={-1.8}
            schStemLength={0.2}
          />
          <port
            name="pin15"
            pinNumber={15}
            aliases={["IO3"]}
            direction="down"
            schX={-1}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin16"
            pinNumber={16}
            aliases={["IO46"]}
            direction="down"
            schX={-0.8}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin17"
            pinNumber={17}
            aliases={["IO9"]}
            direction="down"
            schX={-0.6}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin18"
            pinNumber={18}
            aliases={["IO10"]}
            direction="down"
            schX={-0.4}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin19"
            pinNumber={19}
            aliases={["IO11"]}
            direction="down"
            schX={-0.2}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin20"
            pinNumber={20}
            aliases={["IO12"]}
            direction="down"
            schX={0}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin21"
            pinNumber={21}
            aliases={["IO13"]}
            direction="down"
            schX={0.2}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin22"
            pinNumber={22}
            aliases={["IO14"]}
            direction="down"
            schX={0.4}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin23"
            pinNumber={23}
            aliases={["IO21"]}
            direction="down"
            schX={0.6}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin24"
            pinNumber={24}
            aliases={["IO47"]}
            direction="down"
            schX={0.8}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin25"
            pinNumber={25}
            aliases={["IO48"]}
            direction="down"
            schX={1}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin26"
            pinNumber={26}
            aliases={["IO45"]}
            direction="down"
            schX={1.2}
            schY={-2.8}
            schStemLength={0.2}
          />
          <port
            name="pin27"
            pinNumber={27}
            aliases={["IO0"]}
            direction="right"
            schX={1.8}
            schY={-1.8}
            schStemLength={0.2}
          />
          <port
            name="pin28"
            pinNumber={28}
            aliases={["IO35"]}
            direction="right"
            schX={1.8}
            schY={-1.6}
            schStemLength={0.2}
          />
          <port
            name="pin29"
            pinNumber={29}
            aliases={["IO36"]}
            direction="right"
            schX={1.8}
            schY={-1.4}
            schStemLength={0.2}
          />
          <port
            name="pin30"
            pinNumber={30}
            aliases={["IO37"]}
            direction="right"
            schX={1.8}
            schY={-1.2}
            schStemLength={0.2}
          />
          <port
            name="pin31"
            pinNumber={31}
            aliases={["IO38"]}
            direction="right"
            schX={1.8}
            schY={-1}
            schStemLength={0.2}
          />
          <port
            name="pin32"
            pinNumber={32}
            aliases={["IO39"]}
            direction="right"
            schX={1.8}
            schY={-0.8}
            schStemLength={0.2}
          />
          <port
            name="pin33"
            pinNumber={33}
            aliases={["IO40"]}
            direction="right"
            schX={1.8}
            schY={-0.6}
            schStemLength={0.2}
          />
          <port
            name="pin34"
            pinNumber={34}
            aliases={["IO41"]}
            direction="right"
            schX={1.8}
            schY={-0.4}
            schStemLength={0.2}
          />
          <port
            name="pin35"
            pinNumber={35}
            aliases={["IO42"]}
            direction="right"
            schX={1.8}
            schY={-0.2}
            schStemLength={0.2}
          />
          <port
            name="pin36"
            pinNumber={36}
            aliases={["RXD0"]}
            direction="right"
            schX={1.8}
            schY={0}
            schStemLength={0.2}
          />
          <port
            name="pin37"
            pinNumber={37}
            aliases={["TXD0"]}
            direction="right"
            schX={1.8}
            schY={0.2}
            schStemLength={0.2}
          />
          <port
            name="pin38"
            pinNumber={38}
            aliases={["IO2"]}
            direction="right"
            schX={1.8}
            schY={0.4}
            schStemLength={0.2}
          />
          <port
            name="pin39"
            pinNumber={39}
            aliases={["IO1"]}
            direction="right"
            schX={1.8}
            schY={0.6}
            schStemLength={0.2}
          />
          <port
            name="pin40"
            pinNumber={40}
            aliases={["GND2"]}
            direction="right"
            schX={1.8}
            schY={0.8}
            schStemLength={0.2}
          />
          <port
            name="pin41"
            pinNumber={41}
            aliases={["GND3"]}
            direction="right"
            schX={1.8}
            schY={1}
            schStemLength={0.2}
          />
          <schematicpath
            points={[
              { x: 1.6, y: 1.5 },
              { x: -1.6, y: 1.5 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -1.2, y: 1.8 },
              { x: -1.2, y: 2.6 },
              { x: -0.8, y: 2.6 },
              { x: -0.8, y: 2.1 },
              { x: -0.3, y: 2.1 },
              { x: -0.3, y: 2.6 },
              { x: 0, y: 2.6 },
              { x: 0, y: 2.1 },
              { x: 0.4, y: 2.1 },
              { x: 0.4, y: 2.6 },
              { x: 1.3, y: 2.6 },
            ]}
            strokeColor="#880000"
          />
          <schematictext
            schX={-0.001}
            schY={3.1}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C2913199"],
      }}
      manufacturerPartNumber="ESP32-S3-WROOM-1-N16"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-8.750046mm"
            pcbY="9.0449527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-8.750046mm"
            pcbY="7.7749527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-8.750046mm"
            pcbY="6.5049527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-8.750046mm"
            pcbY="5.2349527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-8.750046mm"
            pcbY="3.9649527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-8.750046mm"
            pcbY="2.6949527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-8.750046mm"
            pcbY="1.4249527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-8.750046mm"
            pcbY="0.1549527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-8.750046mm"
            pcbY="-1.1150473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="-8.750046mm"
            pcbY="-2.3850473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-8.750046mm"
            pcbY="-3.6550473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="-8.750046mm"
            pcbY="-4.9250473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-8.750046mm"
            pcbY="-6.1950473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-8.750046mm"
            pcbY="-7.4650473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-6.985mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-5.715mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-4.445mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-3.175mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-1.905mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-0.635mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="0.635mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="1.905mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="3.175mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="4.445mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="5.715mm"
            pcbY="-8.7449533mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="6.985mm"
            pcbY="-8.7149813mm"
            width="0.8999982mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="8.750046mm"
            pcbY="-7.4650473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="8.750046mm"
            pcbY="-6.1950473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="8.750046mm"
            pcbY="-4.9250473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="8.750046mm"
            pcbY="-3.6550473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="8.750046mm"
            pcbY="-2.3850473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="8.750046mm"
            pcbY="-1.1150473mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="8.750046mm"
            pcbY="0.1549527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="8.750046mm"
            pcbY="1.4249527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="8.750046mm"
            pcbY="2.6949527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="8.750046mm"
            pcbY="3.9649527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="8.750046mm"
            pcbY="5.2349527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="8.750046mm"
            pcbY="6.5049527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="8.750046mm"
            pcbY="7.7749527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="8.750046mm"
            pcbY="9.0449527mm"
            width="1.499997mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-0.100076mm"
            pcbY="-0.0751713mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-1.500124mm"
            pcbY="-0.0751713mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-2.900172mm"
            pcbY="-0.0751713mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-2.900172mm"
            pcbY="2.7249247mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-1.500124mm"
            pcbY="2.7249247mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-0.100076mm"
            pcbY="2.7249247mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-0.100076mm"
            pcbY="1.3248767mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-2.900172mm"
            pcbY="1.3248767mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-1.500124mm"
            pcbY="1.3248767mm"
            width="0.8999982mm"
            height="0.8999982mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 7.297165999999947, y: 10.505351100000212 },
              { x: 7.297165999999947, y: 15.38994890000015 },
              { x: 5.061966000000098, y: 15.38994890000015 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 5.265165999999795, y: 10.505351100000212 },
              { x: 5.265165999999795, y: 15.38994890000015 },
              { x: 2.4129999999998972, y: 15.38994890000015 },
              { x: 2.4129999999998972, y: 13.230948900000158 },
              { x: -0.1270000000000664, y: 13.230948900000158 },
              { x: -0.1270000000000664, y: 15.38994890000015 },
              { x: -2.66700000000003, y: 15.38994890000015 },
              { x: -2.66700000000003, y: 13.230948900000158 },
              { x: -4.953000000000088, y: 13.230948900000158 },
              { x: -4.953000000000088, y: 15.38994890000015 },
              { x: -7.239000000000033, y: 15.38994890000015 },
              { x: -7.239000000000033, y: 11.706948900000157 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -9.000007400000186, y: 10.505351100000212 },
              { x: 9.016999999999939, y: 10.505351100000212 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 9.016999999999939, y: 9.726104500000133 },
              { x: 9.016999999999939, y: 16.53294890000018 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 7.666151799999966, y: -8.994051099999865 },
              { x: 9.016999999999939, y: -8.994051099999865 },
              { x: 9.016999999999939, y: -8.14619909999999 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -9.000007400000186, y: -8.14619909999999 },
              { x: -9.000007400000186, y: -8.994051099999865 },
              { x: -7.66615180000008, y: -8.994051099999865 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -9.000007400000186, y: 16.544963100000018 },
              { x: -9.000007400000186, y: 9.726104500000133 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 9.000007400000072, y: 16.544963100000018 },
              { x: -9.000007400000186, y: 16.544963100000018 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0mm"
            pcbY="17.5633527mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <fabricationnotepath
            route={[
              { x: -7.239000000000033, y: 15.516948900000102 },
              { x: -7.2555862000001525, y: 15.5158567000002 },
              { x: -7.2718675999999505, y: 15.51263090000009 },
              { x: -7.287590200000068, y: 15.507271500000115 },
              { x: -7.302500000000009, y: 15.499930900000095 },
              { x: -7.316317600000048, y: 15.490710700000136 },
              { x: -7.328814400000056, y: 15.479763300000059 },
              { x: -7.339761800000019, y: 15.467266500000164 },
              { x: -7.348982000000092, y: 15.453448900000126 },
              { x: -7.356322599999999, y: 15.438539100000071 },
              { x: -7.361682000000087, y: 15.422816500000181 },
              { x: -7.364907800000083, y: 15.406535100000042 },
              { x: -7.366000000000099, y: 15.38994890000015 },
              { x: -7.366000000000099, y: 11.706948900000043 },
              { x: -7.364907800000083, y: 11.69036270000015 },
              { x: -7.361682000000087, y: 11.674081300000012 },
              { x: -7.356322599999999, y: 11.658358700000122 },
              { x: -7.348982000000092, y: 11.643448900000067 },
              { x: -7.339761800000019, y: 11.629631300000142 },
              { x: -7.328814400000056, y: 11.617134500000134 },
              { x: -7.316317600000048, y: 11.606187100000056 },
              { x: -7.302500000000009, y: 11.596966900000098 },
              { x: -7.287590200000068, y: 11.589626300000077 },
              { x: -7.2718675999999505, y: 11.584266900000102 },
              { x: -7.2555862000001525, y: 11.581041099999993 },
              { x: -7.239000000000033, y: 11.57994890000009 },
              { x: -7.222413799999913, y: 11.581041099999993 },
              { x: -7.206132400000229, y: 11.584266900000102 },
              { x: -7.190409799999998, y: 11.589626300000077 },
              { x: -7.175500000000056, y: 11.596966900000098 },
              { x: -7.161682400000018, y: 11.606187100000056 },
              { x: -7.14918560000001, y: 11.617134500000134 },
              { x: -7.13823820000016, y: 11.629631300000142 },
              { x: -7.129017999999974, y: 11.643448900000067 },
              { x: -7.121677400000067, y: 11.658358700000122 },
              { x: -7.116317999999978, y: 11.674081300000012 },
              { x: -7.113092199999983, y: 11.69036270000015 },
              { x: -7.11200000000008, y: 11.706948900000043 },
              { x: -7.11200000000008, y: 15.262948900000083 },
              { x: -5.080000000000041, y: 15.262948900000083 },
              { x: -5.080000000000041, y: 13.230948900000044 },
              { x: -5.078907800000138, y: 13.214362700000152 },
              { x: -5.075682000000143, y: 13.198081300000013 },
              { x: -5.070322600000054, y: 13.182358700000123 },
              { x: -5.062982000000034, y: 13.167448900000068 },
              { x: -5.053761799999961, y: 13.153631300000143 },
              { x: -5.0428143999999975, y: 13.141134500000135 },
              { x: -5.030317600000103, y: 13.130187100000057 },
              { x: -5.016500000000065, y: 13.120966900000099 },
              { x: -5.00159020000001, y: 13.113626300000078 },
              { x: -4.985867599999892, y: 13.108266900000103 },
              { x: -4.969586200000208, y: 13.105041099999994 },
              { x: -4.953000000000088, y: 13.103948900000091 },
              { x: -2.66700000000003, y: 13.103948900000091 },
              { x: -2.6504137999999102, y: 13.105041099999994 },
              { x: -2.634132400000226, y: 13.108266900000103 },
              { x: -2.618409799999995, y: 13.113626300000078 },
              { x: -2.6035000000000537, y: 13.120966900000099 },
              { x: -2.589682400000015, y: 13.130187100000057 },
              { x: -2.577185600000007, y: 13.141134500000135 },
              { x: -2.566238200000157, y: 13.153631300000143 },
              { x: -2.557017999999971, y: 13.167448900000068 },
              { x: -2.549677400000064, y: 13.182358700000123 },
              { x: -2.5443179999999757, y: 13.198081300000013 },
              { x: -2.54109219999998, y: 13.214362700000152 },
              { x: -2.5400000000000773, y: 13.230948900000044 },
              { x: -2.5400000000000773, y: 15.262948900000083 },
              { x: -0.2540000000000191, y: 15.262948900000083 },
              { x: -0.2540000000000191, y: 13.230948900000044 },
              { x: -0.25290780000011637, y: 13.214362700000152 },
              { x: -0.24968200000012075, y: 13.198081300000013 },
              { x: -0.24432260000003225, y: 13.182358700000123 },
              { x: -0.23698200000012548, y: 13.167448900000068 },
              { x: -0.22776179999993929, y: 13.153631300000143 },
              { x: -0.21681440000008934, y: 13.141134500000135 },
              { x: -0.20431760000008126, y: 13.130187100000057 },
              { x: -0.19050000000004275, y: 13.120966900000099 },
              { x: -0.1755902000001015, y: 13.113626300000078 },
              { x: -0.15986759999987044, y: 13.108266900000103 },
              { x: -0.14358620000018618, y: 13.105041099999994 },
              { x: -0.1270000000000664, y: 13.103948900000091 },
              { x: 2.4129999999998972, y: 13.103948900000091 },
              { x: 2.429586200000017, y: 13.105041099999994 },
              { x: 2.445867599999815, y: 13.108266900000103 },
              { x: 2.4615901999999323, y: 13.113626300000078 },
              { x: 2.4764999999998736, y: 13.120966900000099 },
              { x: 2.490317599999912, y: 13.130187100000057 },
              { x: 2.50281439999992, y: 13.141134500000135 },
              { x: 2.51376179999977, y: 13.153631300000143 },
              { x: 2.52298200000007, y: 13.167448900000068 },
              { x: 2.5303225999999768, y: 13.182358700000123 },
              { x: 2.5356820000000653, y: 13.198081300000013 },
              { x: 2.538907799999947, y: 13.214362700000152 },
              { x: 2.53999999999985, y: 13.230948900000044 },
              { x: 2.53999999999985, y: 15.262948900000083 },
              { x: 5.06196599999987, y: 15.262948900000083 },
              { x: 5.138166000000069, y: 15.262948900000083 },
              { x: 5.138166000000069, y: 10.505351100000098 },
              { x: 5.139258199999972, y: 10.488764900000092 },
              { x: 5.142483999999854, y: 10.472483500000067 },
              { x: 5.1478433999999424, y: 10.456760900000177 },
              { x: 5.155183999999849, y: 10.441851100000122 },
              { x: 5.164404200000149, y: 10.428033500000083 },
              { x: 5.175351599999999, y: 10.415536700000189 },
              { x: 5.187848400000007, y: 10.404589300000112 },
              { x: 5.201666000000046, y: 10.395369100000153 },
              { x: 5.216575799999987, y: 10.388028500000132 },
              { x: 5.232298399999877, y: 10.382669100000044 },
              { x: 5.248579799999902, y: 10.379443300000162 },
              { x: 5.265166000000022, y: 10.378351100000032 },
              { x: 5.281752199999914, y: 10.379443300000162 },
              { x: 5.29803359999994, y: 10.382669100000044 },
              { x: 5.313756200000057, y: 10.388028500000132 },
              { x: 5.328665999999998, y: 10.395369100000153 },
              { x: 5.3424835999998095, y: 10.404589300000112 },
              { x: 5.354980400000045, y: 10.415536700000189 },
              { x: 5.365927799999895, y: 10.428033500000083 },
              { x: 5.37514799999974, y: 10.441851100000122 },
              { x: 5.382488599999874, y: 10.456760900000177 },
              { x: 5.387847999999963, y: 10.472483500000067 },
              { x: 5.391073800000072, y: 10.488764900000092 },
              { x: 5.392165999999975, y: 10.505351100000098 },
              { x: 5.392165999999975, y: 15.262948900000083 },
              { x: 7.170165999999995, y: 15.262948900000083 },
              { x: 7.170165999999995, y: 10.505351100000098 },
              { x: 7.171258199999897, y: 10.488764900000092 },
              { x: 7.174484000000007, y: 10.472483500000067 },
              { x: 7.179843400000095, y: 10.456760900000177 },
              { x: 7.187184000000002, y: 10.441851100000122 },
              { x: 7.1964042000000745, y: 10.428033500000083 },
              { x: 7.2073515999999245, y: 10.415536700000189 },
              { x: 7.2198483999999326, y: 10.404589300000112 },
              { x: 7.233665999999971, y: 10.395369100000153 },
              { x: 7.248575799999912, y: 10.388028500000132 },
              { x: 7.26429840000003, y: 10.382669100000044 },
              { x: 7.280579800000055, y: 10.379443300000162 },
              { x: 7.297165999999947, y: 10.378351100000032 },
              { x: 7.31375219999984, y: 10.379443300000162 },
              { x: 7.3300336000000925, y: 10.382669100000044 },
              { x: 7.3457561999999825, y: 10.388028500000132 },
              { x: 7.360665999999924, y: 10.395369100000153 },
              { x: 7.374483599999735, y: 10.404589300000112 },
              { x: 7.38698039999997, y: 10.415536700000189 },
              { x: 7.39792779999982, y: 10.428033500000083 },
              { x: 7.407147999999893, y: 10.441851100000122 },
              { x: 7.414488600000027, y: 10.456760900000177 },
              { x: 7.4198480000001155, y: 10.472483500000067 },
              { x: 7.423073799999997, y: 10.488764900000092 },
              { x: 7.4241659999999, y: 10.505351100000098 },
              { x: 7.4241659999999, y: 15.38994890000015 },
              { x: 7.423073799999997, y: 15.406535100000042 },
              { x: 7.4198480000001155, y: 15.422816500000181 },
              { x: 7.414488600000027, y: 15.438539100000071 },
              { x: 7.407147999999893, y: 15.453448900000126 },
              { x: 7.39792779999982, y: 15.467266500000164 },
              { x: 7.38698039999997, y: 15.479763300000059 },
              { x: 7.374483599999735, y: 15.490710700000136 },
              { x: 7.360665999999924, y: 15.499930900000095 },
              { x: 7.3457561999999825, y: 15.507271500000115 },
              { x: 7.3300336000000925, y: 15.51263090000009 },
              { x: 7.31375219999984, y: 15.5158567000002 },
              { x: 7.297165999999947, y: 15.516948900000102 },
              { x: 5.265166000000022, y: 15.516948900000102 },
              { x: 5.06196599999987, y: 15.516948900000102 },
              { x: 2.4129999999998972, y: 15.516948900000102 },
              { x: 2.3964137999997774, y: 15.5158567000002 },
              { x: 2.380132400000207, y: 15.51263090000009 },
              { x: 2.364409799999862, y: 15.507271500000115 },
              { x: 2.349499999999921, y: 15.499930900000095 },
              { x: 2.3356823999998824, y: 15.490710700000136 },
              { x: 2.3231855999998743, y: 15.479763300000059 },
              { x: 2.3122382000000243, y: 15.467266500000164 },
              { x: 2.303017999999952, y: 15.453448900000126 },
              { x: 2.295677400000045, y: 15.438539100000071 },
              { x: 2.2903179999999566, y: 15.422816500000181 },
              { x: 2.2870921999998473, y: 15.406535100000042 },
              { x: 2.2859999999999445, y: 15.38994890000015 },
              { x: 2.2859999999999445, y: 13.35794890000011 },
              { x: 0, y: 13.35794890000011 },
              { x: 0, y: 15.38994890000015 },
              { x: -0.001092200000016419, y: 15.406535100000042 },
              { x: -0.0043180000000120344, y: 15.422816500000181 },
              { x: -0.009677400000100533, y: 15.438539100000071 },
              { x: -0.017018000000007305, y: 15.453448900000126 },
              { x: -0.026238200000079814, y: 15.467266500000164 },
              { x: -0.03718560000004345, y: 15.479763300000059 },
              { x: -0.04968240000005153, y: 15.490710700000136 },
              { x: -0.06350000000009004, y: 15.499930900000095 },
              { x: -0.07840980000003128, y: 15.507271500000115 },
              { x: -0.09413240000014866, y: 15.51263090000009 },
              { x: -0.1104137999999466, y: 15.5158567000002 },
              { x: -0.1270000000000664, y: 15.516948900000102 },
              { x: -2.66700000000003, y: 15.516948900000102 },
              { x: -2.68358620000015, y: 15.5158567000002 },
              { x: -2.6998675999999477, y: 15.51263090000009 },
              { x: -2.715590200000065, y: 15.507271500000115 },
              { x: -2.7305000000000064, y: 15.499930900000095 },
              { x: -2.744317600000045, y: 15.490710700000136 },
              { x: -2.756814400000053, y: 15.479763300000059 },
              { x: -2.7677618000000166, y: 15.467266500000164 },
              { x: -2.776982000000089, y: 15.453448900000126 },
              { x: -2.784322599999996, y: 15.438539100000071 },
              { x: -2.7896820000000844, y: 15.422816500000181 },
              { x: -2.79290780000008, y: 15.406535100000042 },
              { x: -2.7940000000000964, y: 15.38994890000015 },
              { x: -2.7940000000000964, y: 13.35794890000011 },
              { x: -4.826000000000022, y: 13.35794890000011 },
              { x: -4.826000000000022, y: 15.38994890000015 },
              { x: -4.827092200000038, y: 15.406535100000042 },
              { x: -4.830318000000034, y: 15.422816500000181 },
              { x: -4.835677400000122, y: 15.438539100000071 },
              { x: -4.843018000000029, y: 15.453448900000126 },
              { x: -4.852238200000102, y: 15.467266500000164 },
              { x: -4.863185600000065, y: 15.479763300000059 },
              { x: -4.87568239999996, y: 15.490710700000136 },
              { x: -4.889499999999998, y: 15.499930900000095 },
              { x: -4.904409800000053, y: 15.507271500000115 },
              { x: -4.9201324000001705, y: 15.51263090000009 },
              { x: -4.936413799999855, y: 15.5158567000002 },
              { x: -4.953000000000088, y: 15.516948900000102 },
              { x: -7.239000000000033, y: 15.516948900000102 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <courtyardoutline
            outline={[
              { x: -9.750044499999944, y: 16.799966900000072 },
              { x: 9.750044499999944, y: 16.799966900000072 },
              { x: 9.750044499999944, y: -9.744951799999967 },
              { x: -9.750044499999944, y: -9.744951799999967 },
              { x: -9.750044499999944, y: 16.799966900000072 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
