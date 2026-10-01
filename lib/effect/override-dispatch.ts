/**
 * Choose an extension hook at an orchestration call site. The nearest own
 * definition wins; when an owner defines both methods, the Effect hook wins.
 * Inspect definitions without reading method getters during this decision.
 *
 * A synchronous facade calls its canonical Effect method directly. It must not
 * dispatch back to itself: a legacy override calling `super` would recurse.
 * Method availability and foreign-object adaptation remain with the caller.
 */
export function prefersNativeMethod(
  target: object,
  syncName: string,
  effectName: string,
): boolean {
  for (
    let methodOwner: object | null = target;
    methodOwner;
    methodOwner = Reflect.getPrototypeOf(methodOwner)
  ) {
    if (Object.hasOwn(methodOwner, effectName)) return true
    if (Object.hasOwn(methodOwner, syncName)) return false
  }
  return false
}

/** Adapters with legacy precedence read the resolved synchronous hook once. */
export function usesDefaultSyncMethod(
  target: object,
  syncName: string,
  legacyFacade: (...args: never[]) => unknown,
): boolean {
  return Reflect.get(target, syncName) === legacyFacade
}
