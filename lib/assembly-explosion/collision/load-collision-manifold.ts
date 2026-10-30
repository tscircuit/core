import type { ManifoldToplevel } from "manifold-3d"

let pending: Promise<ManifoldToplevel> | undefined

/** Load WASM only when an explosion actually needs checking. Node/Bun use the
 * installed package and its adjacent WASM; browsers/workers use matching CDN
 * assets, like 3d-viewer's loadManifold. Keep Node builtins out of browser bundles.
 */
export function loadCollisionManifold(): Promise<ManifoldToplevel> {
  pending ??= (async () => {
    const moduleSpecifier =
      typeof process !== "undefined" && process.versions?.node
        ? "manifold-3d"
        : "https://cdn.jsdelivr.net/npm/manifold-3d@3.5.4/manifold.js"
    const { default: factory } = await import(
      /* @vite-ignore */ /* webpackIgnore: true */ moduleSpecifier
    )
    const manifold: ManifoldToplevel = await factory()
    manifold.setup()
    return manifold
  })().catch((error) => {
    pending = undefined
    throw error
  })
  return pending
}
