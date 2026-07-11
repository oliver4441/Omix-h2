#!/bin/bash
# Render build script - captures errors for debugging
set -o pipefail

echo "=== Step 1: npm install ==="
npm install 2>&1
if [ $? -ne 0 ]; then
    echo "npm install FAILED"
    exit 1
fi
echo "npm install OK"

echo "=== Step 2: prisma generate (main) ==="
./node_modules/.bin/prisma generate 2>&1
if [ $? -ne 0 ]; then
    echo "prisma generate (main) FAILED"
    exit 1
fi
echo "prisma generate (main) OK"

echo "=== Step 3: prisma generate (local) ==="
./node_modules/.bin/prisma generate --schema=prisma/local-schema.prisma 2>&1
if [ $? -ne 0 ]; then
    echo "prisma generate (local) FAILED"
    exit 1
fi
echo "prisma generate (local) OK"

echo "=== Step 4: next build ==="
./node_modules/.bin/next build 2>&1
if [ $? -ne 0 ]; then
    echo "next build FAILED"
    exit 1
fi
echo "Build COMPLETE"
