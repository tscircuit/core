/**
 * A component that exists only in the render tree, with no Circuit JSON record
 * of its own, and therefore cannot be re-inflated.
 *
 * Subcircuit isolation renders a subtree separately, **replaces it with
 * `AnyCircuitElement[]`** and rebuilds components from those records with the
 * inflators in `./inflators/`. Anything with no circuit-json record has nothing
 * to rebuild from, so it silently disappears. So if we find any elements that are
 * "Ephemeral" i.e. do not have a circuit-json representaiton in the tsx tree,
 * disable caching. This is not especially important yet; subcircuit caching is
 * not yet widely used nor does it boost performance substantially in most cases
 * yet, this isolation guard is intended to be helpful to developers and agents
 * who are writing new elements to alleviate concern that subcircuit isolation will
 * cause silent bugs; now it won't, it will safely disable caching for subcircuits
 * containing non-inflatable elements, which is fine for now.
 *
 * The subtree is checked in `./isolation-round-trip.ts`, which declines
 * isolation for any subcircuit containing one of these.
 */
export interface EphemeralDeclaration {
  /** Marks a component that cannot survive a Circuit JSON round trip. */
  isEphemeralDeclaration: true
}

export const isEphemeralDeclaration = (component: unknown): boolean =>
  Boolean((component as Partial<EphemeralDeclaration>)?.isEphemeralDeclaration)
