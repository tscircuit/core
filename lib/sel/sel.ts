import type {
  ChipProps,
  PinLabelFromPinLabelMap,
  PinLabelsProp,
  ChipConnections,
  ChipPinLabels,
  Connections,
  Selectors,
} from "@tscircuit/props"
import type {
  CommonPinNames,
  Nums16,
  Nums40,
  PinNumbers100,
  TransistorPinNames,
} from "./sel-utility-types"

/**
 * A refdes of a given prefix with any number: `R1`, `R535`, `U501`, `CN12`.
 *
 * Enumerating "0".."40" only covered hand-written example boards. Real boards
 * number by block (`U100`, `U501`) or just keep counting (`R535`, `C403`), and
 * every one of those designators fell through to the generic
 * `Record<string, ...>` branch, where a chip-typed `sel.U501(Chip)` resolved to
 * `never`. A template literal makes any number type-check while still rejecting
 * prefixes that are not refdes (see sel1.test.ts).
 */
type RefDes<Prefix extends string> = `${Prefix}${number}`

type NonPolarizedSel = Record<
  RefDes<"R"> | RefDes<"F">,
  {
    pin1: string
    pin2: string
    pos: string
    neg: string
  }
>

type SwSel = Record<
  RefDes<"SW">,
  {
    pin1: string
    pin2: string
    pin3: string
    pin4: string
    pin5: string
    pin6: string
    pos: string
    neg: string
    side1: string
    side2: string
  }
>

type PolarizedSel = Record<
  | RefDes<"C">
  | RefDes<"L">
  | RefDes<"LED">
  | RefDes<"D">
  | RefDes<"Y">
  | `B${Nums16}`,
  {
    pin1: string
    pin2: string
    anode: string
    cathode: string
    pos: string
    neg: string
  }
>

type CommonNetNames =
  | "VCC"
  | "GND"
  | "VDD"
  | "PWR"
  | "V5"
  | "V3_3"
  | "VIN"
  | "SHLD"
  | "EN"
  | "SCL"
  | "SDA"
  | "MOSI"
  | "MISO"
  | "SCK"
  | "CS"
  | "N_CS"
  | "FLASH_SDO"
  | "FLASH_SDI"
  | "FLASH_SCK"
  | "FLASH_N_CS"
  | "FLASH_N_WP"
  | "FLASH_N_HOLD"
  | "INT"
  | "N_INT"
  | "VBUS"
  | "SWCLK"
  | "USB_DM"
  | "USB_DP"
  | "QSPI_SS"
  | "XIN"
  | "XOUT"
  | "RUN"
  | "SWD"
  | `GPIO${Nums40}`

type TransistorSel = Record<RefDes<"Q">, Record<TransistorPinNames, string>>

type JumperSel = Record<
  RefDes<"J"> | RefDes<"JP"> | RefDes<"CN">,
  Record<PinNumbers100 | CommonPinNames, string> & ChipFnSel
>

type ChipSel = Record<
  RefDes<"U"> | "USBC",
  Record<CommonPinNames | PinNumbers100, string> & ChipFnSel
>

type NetSelFn<N extends string = CommonNetNames> = (<
  N2 extends string,
>() => Record<N | N2, string>) &
  Record<N, string>

type NetSel<N extends string = CommonNetNames> = Record<"net", NetSelFn<N>>

type ExplicitModuleSel = Record<
  "subcircuit" | "module" | "group",
  Record<RefDes<"S"> | RefDes<"M"> | RefDes<"G">, SelWithoutSubcircuit>
>

export type GenericConnectionsAndSelectorsSel = Record<
  string,
  <CMP_FN extends (props: any) => any>(
    component: CMP_FN,
  ) => CMP_FN extends (props: infer P) => any
    ? P extends { connections: infer CN }
      ? CN
      : P extends { selectors: infer SEL }
        ? SEL extends Record<string, Record<string, string>>
          ? {
              [K in keyof SEL]: SEL[K] extends Record<string, string>
                ? SEL[K]
                : never
            }
          : never
        : never
    : never
>
type TestPointSel = Record<RefDes<"TP">, { pin1: string }>

type SelWithoutSubcircuit = NonPolarizedSel &
  PolarizedSel &
  TransistorSel &
  JumperSel &
  ChipSel &
  SwSel &
  NetSel &
  TestPointSel &
  GenericConnectionsAndSelectorsSel

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never

type ChipFn<T extends ChipProps<any>> = (props: T) => any
type ChipFnSel = <T extends ChipFn<any> | string>(
  chipFn?: T,
) => UnionToIntersection<
  T extends ChipFn<any>
    ? ChipConnections<T>
    : T extends string
      ? { [K in T]: string }
      : never
>

type SelFn = <P extends string>(refdes: string) => Record<P, string>

export type Sel = SelFn & ExplicitModuleSel & SelWithoutSubcircuit

export const sel: Sel = new Proxy(
  (refdes: string) =>
    new Proxy(
      {},
      {
        get: (_, pin: string) => `.${refdes} > .${pin}`,
      },
    ),
  {
    get: (_, prop1: string) => {
      // Create a function that will be our proxy target
      const fn = (...args: any[]) => {
        const chipFnOrPinType = args[0]

        // Return a proxy for either case - with or without args
        return new Proxy(
          {},
          {
            get: (_, pinName: string) => {
              return `.${prop1} > .${pinName}`
            },
          },
        )
      }

      // Create a proxy around this function
      return new Proxy(fn, {
        // This handles dot notation access like sel.U1.PIN
        get: (_, prop2: string) => {
          if (prop1 === "net") {
            return `net.${prop2}`
          }
          if (prop1 === "subcircuit") {
            return new Proxy(
              {},
              {
                get: (_, prop3: string) => {
                  return new Proxy(
                    {},
                    {
                      get: (_, prop4: string) => {
                        return `subcircuit.${prop2} > .${prop3} > .${prop4}`
                      },
                    },
                  )
                },
              },
            )
          }
          return `.${prop1} > .${prop2}`
        },
        // This handles function calls like...
        // - sel.U1(MyChip)
        // - sel.U1(({ selectors: { U1: { GND: "GND", VCC: "VCC" } } }) => ...)
        // - sel.U1(({ connections: { GND: "GND", VCC: "VCC" } }) => ...)
        apply: (target, _, args: any[]) => {
          if (prop1 === "net") {
            return new Proxy(
              {},
              {
                get: (_, netName: string) => `net.${netName}`,
              },
            )
          }

          return new Proxy(
            {},
            {
              get: (_, pinOrSubComponentName: string) => {
                const pinResult = `.${prop1} > .${pinOrSubComponentName}`
                const chipPrefixes = ["U", "J", "CN"]
                if (chipPrefixes.some((p) => prop1.startsWith(p))) {
                  return pinResult
                }

                return new Proxy(new String(pinResult), {
                  get: (_, nestedProp: string) => {
                    if (
                      typeof nestedProp === "symbol" ||
                      nestedProp === "toString"
                    ) {
                      return () => pinResult
                    }
                    return `.${prop1} > .${pinOrSubComponentName} > .${nestedProp}`
                  },
                })
              },
            },
          )
        },
      })
    },
  },
) as any
