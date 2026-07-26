import { selectOne } from "css-select"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { cssSelectPrimitiveComponentAdapter } from "../base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { Board } from "../normal-components/Board"

export const getReferencedEnclosureBoard = (
  component: PrimitiveComponent,
  boardRef: string,
): Board => {
  const rootComponent = component.root?.firstChild
  const selectedComponent = rootComponent
    ? selectOne(boardRef, rootComponent, {
        adapter: cssSelectPrimitiveComponentAdapter,
      })
    : null
  const board =
    selectedComponent instanceof Board
      ? selectedComponent
      : [rootComponent, ...(rootComponent?.getDescendants() ?? [])].find(
          (descendant): descendant is Board =>
            descendant instanceof Board &&
            descendant.isMatchingNameOrAlias(boardRef),
        )
  if (!(board instanceof Board)) {
    throw new Error(
      `Could not find a <board /> matching enclosure boardRef "${boardRef}"`,
    )
  }
  return board
}
