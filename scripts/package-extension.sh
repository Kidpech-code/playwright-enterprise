#!/usr/bin/env bash

set -euo pipefail

VERSION="$(node -e "process.stdout.write(require('./extension/manifest.json').version)")"
ZIP_PATH="release/testing-companion-${VERSION}.zip"

mkdir -p release

(
  cd extension
  zip -r "../${ZIP_PATH}" . -x "*.DS_Store"
)

shasum -a 256 "${ZIP_PATH}"
echo "Packaged extension: ${ZIP_PATH}"
