#!/bin/sh
# Type check, test and build offline. Usage: sh check.sh
cd "$(dirname "$0")" && node gen-icons.mjs && node /opt/npm-tools/node_modules/typescript/bin/tsc -p tsconfig.json --noEmit && node build.mjs test | tail -${1:-2} && node build.mjs build
