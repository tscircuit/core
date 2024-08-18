import type { AnySourceComponent } from "@tscircuit/soup"

export { BASE_SYMBOLS } from "schematic-symbols"

/**
 * This is just a proxy to make autocomplete easier, it just returns whatever
 * key you pass in. It's helpful when you want to make it a bit more obvious
 * how to select the key you want to use without obscuring the actual key.
 */
const typeProxy = new Proxy(
  {},
  {
    get: (target, prop) => prop,
  },
) as any

export const FTYPE: {
  [T in AnySourceComponent["ftype"]]: T
} = typeProxy
