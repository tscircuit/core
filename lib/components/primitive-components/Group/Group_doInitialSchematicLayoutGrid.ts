import type { Group } from "./Group"

export function Group_doInitialSchematicLayoutGrid(group: Group<any>) {
  // TODO find direct children and their order
  // TODO for each child, note the size of the child
  // TODO the largest child size is the grid cell size
  // TODO use grid gap to compute the positions of each child (centered at group.getSchematicPositionBeforeLayout())
}
