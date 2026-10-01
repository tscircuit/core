import * as Effect from "effect/Effect"
// See CATALOGUE.md for information about the catalogue pattern
// The catalogue is a registry of all the component constructors, it has a
// bunch of purposes but importantly it reduces circular dependencies.

export type Instance = {
  // Add any universal methods for classes, e.g. ".add"
} & { [key: string]: any }

export interface Catalogue {
  [name: string]: {
    new (...args: any): Instance
  }
}

export const catalogue: Catalogue = {}
export const extendCatalogue = (objects: object): void => {
  runCoreSync(extendCatalogueEffect(objects))
}

/** Preserve case-sensitive keys and their lowercase JSX aliases. */
export const extendCatalogueEffect = (objects: object) =>
  Effect.gen(function* () {
    const lowercaseConstructors = yield* coreSync(
      () =>
        Object.fromEntries(
          Object.entries(objects).map(([name, constructor]) => [
            name.toLowerCase(),
            constructor,
          ]),
        ),
      "catalogue_lowercase_aliases",
    )
    yield* coreSync(() => {
      Object.assign(catalogue, objects)
      Object.assign(catalogue, lowercaseConstructors)
    }, "register_component_constructors")
  })
import { coreSync, runCoreSync } from "lib/effect/core-error"
