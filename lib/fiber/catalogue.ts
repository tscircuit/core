import { coreSync } from "lib/effect/core-error"
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

/** Registry boundary: preserve case-sensitive keys and their lowercase JSX aliases. */
export const extendCatalogue = (objects: object): void => {
  const lowercaseConstructors = Object.fromEntries(
    Object.entries(objects).map(([name, constructor]) => [
      name.toLowerCase(),
      constructor,
    ]),
  )
  Object.assign(catalogue, objects)
  Object.assign(catalogue, lowercaseConstructors)
}

/** Compatibility adapter for callers already composing catalogue registration. */
export const extendCatalogueEffect = (objects: object) =>
  coreSync(() => extendCatalogue(objects))
