import { expect, test } from "bun:test"
import type { ChipProps, CommonLayoutProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["pin1", "GP0_SPI0RX_I2C0SDA_UART0TX"],
  pin2: ["pin2", "GP1_SPI0CSn_I2C0SCL_UART0RX"],
  pin3: ["pin3", "GND1"],
  pin4: ["pin4", "GP2_SPI0SCK_I2C1SDA"],
  pin5: ["pin5", "GP3_SPI0TX_I2C1SCL"],

  pin6: ["pin6", "GP4_SPI0RX_I2C0SDA_UART1TX"],
  pin7: ["pin7", "GP5_SPI0CSn_I2C0SCL_UART1RX"],
  pin8: ["pin8", "GND3"],
  pin9: ["pin9", "GP6_SPI0SCK_I2C1SDA"],
  pin10: ["pin10", "GP7_SPI0TX_I2C1SCL"],
  pin11: ["pin11", "GP8_SPI1RX_I2C0SDA_UART1TX"],
  pin12: ["pin12", "GP9_SPI1CSn_I2C0SCL_UART1RX"],
  pin13: ["pin13", "GND4"],
  pin14: ["pin14", "GP10_SPI1SCK_I2C1SDA"],
  pin15: ["pin15", "GP11_SPI1TX_I2C1SCL"],
  pin16: ["pin16", "GP12_SPI1RX_I2C0SDA_UART0TX"],
  pin17: ["pin17", "GP13_SPI1CSn_I2C0SCL_UART0RX"],
  pin18: ["pin18", "GND6"],
  pin19: ["pin19", "GP14_SPI1SCK_I2C1SDA"],
  pin20: ["pin20", "GP15_SPI1TX_I2C1SCL"],
  pin21: ["pin21", "GP16_SPI0RX_UART0RX"],
  pin22: ["pin22", "GP17_SPI0CSn_UART0TX"],
  pin23: ["pin23", "GND7"],
  pin24: ["pin24", "GP18_SPI0SCK_I2C1SDA"],
  pin25: ["pin25", "GP19_SPI0TX_I2C1SCL"],
  pin26: ["pin26", "GP20_I2C0SDA"],
  pin27: ["pin27", "GP21_I2C0SCL"],
  pin28: ["pin28", "GND5"],
  pin29: ["pin29", "GP22"],
  pin30: ["pin30", "RUN"],
  pin31: ["pin31", "GP26_ADC0_I2C1SDA"],
  pin32: ["pin32", "GP27_ADC1_I2C1SCL"],
  pin33: ["pin33", "GND_AGND"],
  pin34: ["pin34", "GP28_ADC2"],
  pin35: ["pin35", "ADC_VREF"],
  pin36: ["pin36"],
  pin37: ["pin37", "3V3_EN"],
  pin38: ["pin38", "GND2"],
  pin39: ["pin39", "VSYS"],
  pin40: ["pin40", "VBUS"],
  pin41: ["pin41", "TP6"],
  pin42: ["pin42", "TP5"],
  pin43: ["pin43", "TP4"],
  pin44: ["pin44", "TP3"],
  pin45: ["pin45", "TP2"],
  pin46: ["pin46", "TP1"],
} as const

export const PICO_W = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      {...props}
      schWidth={5}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=07c2e528ec9a4008b33211831b7000e1&pn=C7203003",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C7203003"],
      }}
      manufacturerPartNumber="PICO_W"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin41"]}
            pcbX="-10.940014949999977mm"
            pcbY="-2.499740999999972mm"
            width="1.499997mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin42"]}
            pcbX="-13.44013695000001mm"
            pcbY="-2.499740999999972mm"
            width="1.499997mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin43"]}
            pcbX="-15.940004950000002mm"
            pcbY="-2.499740999999972mm"
            width="1.499997mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin44"]}
            pcbX="-24.239962950000063mm"
            pcbY="-0.999870999999871mm"
            width="1.499997mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin45"]}
            pcbX="-24.239962950000063mm"
            pcbY="1.0001250000000255mm"
            width="1.499997mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin46"]}
            pcbX="-20.939994949999914mm"
            pcbY="0.00012700000002041634mm"
            width="1.499997mm"
            height="1.499997mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-24.07003695000003mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="-24.07003695000003mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-21.530036950000067mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="-21.530036950000067mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-18.99003694999999mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="-18.99003694999999mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-16.450036950000026mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="-16.450036950000026mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-13.910036950000062mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="-13.910036950000062mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-11.370036949999985mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="-11.370036949999985mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-8.830036950000022mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="-8.830036950000022mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-6.290036950000058mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="-6.290036950000058mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-3.7500369499999806mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="-3.7500369499999806mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="-1.210036950000017mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="-1.210036950000017mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="1.3299630499999466mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="1.3299630499999466mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="3.869963050000024mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="3.869963050000024mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="6.409963049999988mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="6.409963049999988mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="8.949963049999951mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="8.949963049999951mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="11.489963049999915mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="11.489963049999915mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="14.029963049999992mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="14.029963049999992mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="16.569963049999956mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="16.569963049999956mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="19.10996304999992mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="19.10996304999992mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="21.649963049999997mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="21.649963049999997mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="24.18996304999996mm"
            pcbY="-9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="24.18996304999996mm"
            pcbY="9.689973000000009mm"
            width="1.5999967999999998mm"
            height="3.1999935999999995mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 17.601101449999874, y: -10.499877399999946 },
              { x: 18.078900849999968, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 25.55998825000006, y: 3.5711383999999953 },
              { x: 25.55998825000006, y: -3.5710622000000285 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 25.22110144999988, y: -10.499877399999946 },
              { x: 25.55998825000006, y: -10.499877399999946 },
              { x: 25.55998825000006, y: -3.5710622000000285 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 25.55998825000006, y: 3.5711383999999953 },
              { x: 25.55998825000006, y: 10.500080600000047 },
              { x: 25.22110144999988, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -25.101048350000042, y: 10.499953600000026 },
              { x: -25.439808149999976, y: 10.499953600000026 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -25.439935149999997, y: 10.500080600000047 },
              { x: -25.439935149999997, y: -10.499877399999946 },
              { x: -25.101099149999982, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -26.739830950000055, y: 3.9996363999999858 },
              { x: -26.339603149999903, y: 3.9996363999999858 },
              { x: -26.339603149999903, y: -4.000245999999834 },
              { x: -26.739830950000055, y: -4.000245999999834 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -26.339603149999903, y: -3.8089332000000695 },
              { x: -25.465233549999994, y: -3.8089332000000695 },
              { x: -25.439808149999976, y: -3.834358599999973 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -26.339603149999903, y: 3.8025069999999914 },
              { x: -25.439808149999976, y: 3.8025069999999914 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -26.739830950000055, y: 3.9996363999999858 },
              { x: -26.739830950000055, y: -4.000245999999834 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -22.561099150000132, y: 10.500080600000047 },
              { x: -23.03889855, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -20.021099150000055, y: 10.500080600000047 },
              { x: -20.498898550000035, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -17.48109915000009, y: 10.500080600000047 },
              { x: -17.95889855000007, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -14.941099150000014, y: 10.500080600000047 },
              { x: -15.418898550000108, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -12.40109915000005, y: 10.500080600000047 },
              { x: -12.87889855000003, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -9.861099150000086, y: 10.500080600000047 },
              { x: -10.338898550000067, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -7.321099150000123, y: 10.500080600000047 },
              { x: -7.79889854999999, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.7810991500000455, y: 10.500080600000047 },
              { x: -5.258898550000026, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.241099150000082, y: 10.500080600000047 },
              { x: -2.7188985500000626, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.29890084999999544, y: 10.500080600000047 },
              { x: -0.17889855000009902, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.838900849999959, y: 10.500080600000047 },
              { x: 2.3611014499998646, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 5.378900849999923, y: 10.500080600000047 },
              { x: 4.901101449999942, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 7.918900849999886, y: 10.500080600000047 },
              { x: 7.441101450000019, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 10.458900849999964, y: 10.500080600000047 },
              { x: 9.98110144999987, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 12.998900849999927, y: 10.500080600000047 },
              { x: 12.521101449999946, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 15.538900850000005, y: 10.500080600000047 },
              { x: 15.06110144999991, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 18.078900849999968, y: 10.500080600000047 },
              { x: 17.601101449999874, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 20.618900849999932, y: 10.500080600000047 },
              { x: 20.14110144999995, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 23.158900849999895, y: 10.500080600000047 },
              { x: 22.68110145000003, y: 10.500080600000047 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 22.68110145000003, y: -10.499877399999946 },
              { x: 23.158900849999895, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 20.14110144999995, y: -10.499877399999946 },
              { x: 20.618900849999932, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 15.06110144999991, y: -10.499877399999946 },
              { x: 15.538900850000005, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 12.521101449999946, y: -10.499877399999946 },
              { x: 12.998900849999927, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 9.98110144999987, y: -10.499877399999946 },
              { x: 10.458900849999964, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 7.441101450000019, y: -10.499877399999946 },
              { x: 7.918900849999886, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.901101449999942, y: -10.499877399999946 },
              { x: 5.378900849999923, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.3611014499998646, y: -10.499877399999946 },
              { x: 2.838900849999959, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.17889855000009902, y: -10.499877399999946 },
              { x: 0.29890084999999544, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.7188985500000626, y: -10.499877399999946 },
              { x: -2.241099150000082, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.258898550000026, y: -10.499877399999946 },
              { x: -4.7810991500000455, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -7.79889854999999, y: -10.499877399999946 },
              { x: -7.321099150000123, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -10.338898550000067, y: -10.499877399999946 },
              { x: -9.861099150000086, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -12.87889855000003, y: -10.499877399999946 },
              { x: -12.40109915000005, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -15.418898550000108, y: -10.499877399999946 },
              { x: -14.941099150000014, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -17.95889855000007, y: -10.499877399999946 },
              { x: -17.48109915000009, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -20.498898550000035, y: -10.499877399999946 },
              { x: -20.021099150000055, y: -10.499877399999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -23.03889855, y: -10.499877399999946 },
              { x: -22.561099150000132, y: -10.499877399999946 },
            ]}
          />
        </footprint>
      }
    />
  )
}

const pinAttributes: any = {}
for (let i = 1; i <= 46; i++) {
  pinAttributes[`pin${i}`] = { includeInBoardPinout: true }
}

test("pinout basic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board title="PICO W Test">
      <PICO_W name="U1" pcbRotation="-90deg" pinAttributes={pinAttributes} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toMatchPinoutSnapshot(import.meta.path)
})
