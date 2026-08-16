/**
 * A component that exists only in the render tree, with no Circuit JSON record
 * of its own.
 *
 * `<enclosure.cutoutaperture>` and `<enclosure.screwboss>` are the current
 * examples: they are read by the enclosure solver during the render and emit
 * nothing, deliberately, because a solver input is not something Circuit JSON
 * should have to carry (see the mounting-hardware RFC 1.5.3).
 *
 * That choice has one consequence, and this is it. Subcircuit isolation renders
 * a subtree separately, **replaces it with `AnyCircuitElement[]`** and rebuilds
 * components from those records with the inflators in `./inflators/`. Anything
 * with no record has nothing to rebuild from, so it silently disappears -- and
 * "silently" is the problem: the enclosure comes out missing a boss with no
 * error anywhere.
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
