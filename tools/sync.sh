#!/bin/sh
# Copy the site to the preview folder served by the "acg203-study" launch config.
cd "$(dirname "$0")/.." || exit 1
mkdir -p /private/tmp/acg203-study-preview
rsync -a --delete --exclude source --exclude docs --exclude tests --exclude tools --exclude .superpowers --exclude .claude ./ /private/tmp/acg203-study-preview/
cp tools/nocache_server.py /private/tmp/acg203-study-server.py
