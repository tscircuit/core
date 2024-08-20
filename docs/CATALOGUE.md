# @tscircuit/core Catalogue

The catalogue pattern is used to register components with the ReactFiber reconciler

If your component is exported from `lib/components/index.ts`, it will be registered
automatically when the library is used because of the `lib/register-catalogue.ts` file.

The catalogue is a way to make tscircuit more extensible (because new components can
be registered in the catalogue) and avoids circular dependencies because the
catalogue is dynamically registered, so the react-fiber layer doesn't need to
import the components.
