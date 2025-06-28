declare module "css-select" {
  export interface Options<T, N> {
    adapter?: {
      isTag?: (node: T) => node is T
      getParent?: (node: T) => T | null
      getChildren?: (node: T) => T[]
      getName?: (node: T) => string
      getAttributeValue?: (node: T, name: string) => string | null
      hasAttrib?: (node: T, name: string) => boolean
      getSiblings?: (node: T) => T[]
      prevElementSibling?: (node: T) => T | null
      getText?: (node: T) => string
      removeSubsets?: (nodes: T[]) => T[]
      existsOne?: (test: (node: T) => boolean, nodes: T[]) => boolean
      findAll?: (test: (node: T) => boolean, nodes: T[]) => T[]
      findOne?: (test: (node: T) => boolean, nodes: T[]) => T | null
      equals?: (a: T, b: T) => boolean
      isHovered?: (elem: T) => boolean
      isVisited?: (elem: T) => boolean
      isActive?: (elem: T) => boolean
    }
    cacheResults?: boolean
  }

  export function selectOne<T, N>(
    selector: string,
    root: T | T[],
    options?: Options<T, N>,
  ): T | null

  export function selectAll<T, N>(
    selector: string,
    root: T | T[],
    options?: Options<T, N>,
  ): T[]

  export function compile<T, N>(
    selector: string,
    options?: Options<T, N>,
  ): (root: T | T[]) => T[]
}
