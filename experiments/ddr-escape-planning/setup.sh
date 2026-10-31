#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
bun install
mkdir -p vendor
if [ ! -d vendor/solver/.git ]; then git clone https://github.com/tscircuit/bus-lanes-solver.git vendor/solver; fi
git -C vendor/solver checkout --detach 992e0448aee2c40b0d8fa1d3f0537f364b0e60cc
if git -C vendor/solver apply --check ../../common-solver.patch; then git -C vendor/solver apply ../../common-solver.patch; else git -C vendor/solver apply --reverse --check ../../common-solver.patch; fi
(cd vendor/solver && bun install)
