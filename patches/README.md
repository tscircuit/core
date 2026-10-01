The props patch mirrors https://github.com/tscircuit/props/pull/886 and allows this PR's offset direction regression tests and type declarations to run against the currently published `@tscircuit/props@0.0.672`.

Before merging, replace the patch with a released props version containing that PR (update both the development dependency and the override). The patch is only used for local/CI development; consumers need the corresponding props release.
