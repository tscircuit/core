import type { AnySourceComponent } from "circuit-json";
import type { BaseSymbolName } from "schematic-symbols";

/**
 * This is just a proxy to make autocomplete easier, it just returns whatever
 * key you pass in. It's helpful when you want to make it a bit more obvious
 * how to select the key you want to use without obscuring the actual key.
 */
const stringProxy = new Proxy(
  {},
  {
    get: (target, prop) => prop,
  },
) as any;

export type Ftype = Extract<AnySourceComponent, { ftype: string }>["ftype"];

export const FTYPE: {
  [T in Extract<AnySourceComponent, { ftype: string }>["ftype"]]: T;
} = stringProxy;

export const SYMBOL: {
  [T in BaseSymbolName]: T;
} = stringProxy;

export type TwoPinPorts = "pin1" | "pin2";
export type PassivePorts = TwoPinPorts;
export type PolarizedPassivePorts =
  | PassivePorts
  | "anode"
  | "cathode"
  | "pos"
  | "neg";
export type TransistorPorts =
  | "pin1"
  | "pin2"
  | "pin3"
  | "emitter"
  | "collector"
  | "base";

export type { BaseSymbolName };
