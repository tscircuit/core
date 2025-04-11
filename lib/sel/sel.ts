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

type NonPolarizedSel = Record<
  `R${Nums40}`,
  {
    pin1: string
    pin2: string
    pos: string
    neg: string
  }
>

type SwSel = Record<
  `SW${Nums40}`,
  {
    pin1: string
    pin2: string
    pos: string
    neg: string
    side1: string
    side2: string
  }
>

type PolarizedSel = Record<
  | `C${Nums40}`
  | `L${Nums40}`
  | `LED${Nums40}`
  | `D${Nums40}`
  | `Y${Nums40}`
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

type CommonNetNames = "VCC" | "GND" | "VDD" | "PWR" | "V5" | "V3_3"

type TransistorSel = Record<`Q${Nums40}`, Record<TransistorPinNames, string>>

type JumperSel = Record<
  `J${Nums40}` | `CN${Nums40}`,
  Record<PinNumbers100 | CommonPinNames, string>
>

type ChipSel = Record<`U${Nums40}`, Record<CommonPinNames, string> & ChipFnSel>

type NetSel = Record<"net", Record<CommonNetNames, string>>

type ExplicitModuleSel = Record<
  "subcircuit" | "module" | "group",
  Record<`S${Nums40}` | `M${Nums40}` | `G${Nums40}`, SelWithoutSubcircuit>
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

type SelWithoutSubcircuit = NonPolarizedSel &
  PolarizedSel &
  TransistorSel &
  JumperSel &
  ChipSel &
  SwSel &
  NetSel &
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

export type Sel = ExplicitModuleSel & SelWithoutSubcircuit

export const sel: Sel = new Proxy(
  {},
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
        // This handles function calls like sel.U1(MyChip)
        apply: (target, _, args: any[]) => {
          return new Proxy(
            {},
            {
              get: (_, pinName: string) => {
                return `.${prop1} > .${pinName}`
              },
            },
          )
        },
      })
    },
  },
) as any
