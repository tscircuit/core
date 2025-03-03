import type { SoupUtilObjects } from "@tscircuit/soup-util"

export const getDescendantSubcircuitIds = (
  db: SoupUtilObjects,
  root_subcircuit_id: string,
): string[] => {
  const groups = db.source_group.list()
  const result: string[] = []

  // Function to recursively find all subcircuit IDs under a parent
  const findDescendants = (parentId: string) => {
    // Find all groups that have this parent
    const children = groups.filter(
      (group) => group.parent_subcircuit_id === parentId,
    )

    // Add each child's subcircuit_id to the result and recursively find their descendants
    for (const child of children) {
      if (child.subcircuit_id) {
        result.push(child.subcircuit_id)
        findDescendants(child.subcircuit_id)
      }
    }
  }

  // Start the recursive search from the root subcircuit
  findDescendants(root_subcircuit_id)

  return result
}
