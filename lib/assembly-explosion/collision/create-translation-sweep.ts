import type { Manifold, ManifoldToplevel, Vec3 } from "manifold-3d"

/** Continuous sweep of a closed triangle solid through a straight translation.
 * Inputs and output are right-handed circuit-world points in mm (+Z above);
 * displacement is a world-space vector. Each leading boundary triangle sweeps
 * a triangular prism. Their union with the start solid covers every intermediate
 * pose, preserving concavities and holes. No time sampling or whole-part hull.
 * The caller owns the returned solid; the input remains borrowed.
 */
export function createTranslationSweep(
  solid: Manifold,
  displacement: Vec3,
  manifold: ManifoldToplevel,
): Manifold {
  const mesh = solid.getMesh()
  const prisms: Manifold[] = []
  const point = (index: number): Vec3 => [
    mesh.vertProperties[index * mesh.numProp],
    mesh.vertProperties[index * mesh.numProp + 1],
    mesh.vertProperties[index * mesh.numProp + 2],
  ]
  try {
    for (let index = 0; index < mesh.triVerts.length; index += 3) {
      const a = point(mesh.triVerts[index])
      const b = point(mesh.triVerts[index + 1])
      const c = point(mesh.triVerts[index + 2])
      const ab = b.map((v, axis) => v - a[axis])
      const ac = c.map((v, axis) => v - a[axis])
      const facing =
        (ab[1] * ac[2] - ab[2] * ac[1]) * displacement[0] +
        (ab[2] * ac[0] - ab[0] * ac[2]) * displacement[1] +
        (ab[0] * ac[1] - ab[1] * ac[0]) * displacement[2]
      if (facing <= 0) continue
      const vertices = [a, b, c]
      prisms.push(
        manifold.Manifold.hull([
          ...vertices,
          ...vertices.map(
            (p): Vec3 => [
              p[0] + displacement[0],
              p[1] + displacement[1],
              p[2] + displacement[2],
            ],
          ),
        ]),
      )
    }
    const sweep = manifold.Manifold.union([solid, ...prisms])
    // Force evaluation before deleting operands, including native error checks.
    if (sweep.status() !== "NoError") {
      sweep.delete()
      throw new Error("Could not construct the continuous translation sweep")
    }
    return sweep
  } finally {
    for (const prism of prisms) prism.delete()
  }
}
