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
  const altKeys = Object.fromEntries(
    Object.entries(objects).map(([key, v]) => [key.toLowerCase(), v]),
  )
  Object.assign(catalogue, objects)
  Object.assign(catalogue, altKeys)
}
