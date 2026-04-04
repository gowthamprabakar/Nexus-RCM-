#!/bin/bash
export PATH="/opt/homebrew/bin:/opt/homebrew/Cellar/node/25.6.0/bin:$PATH"
cd "$(dirname "$0")"
exec npx vite --port 5174
