@echo off
REM Example usage of API benchmarking scripts
REM This script demonstrates how to run the benchmarks with different configurations

echo 🚀 API Benchmarking Examples
echo ==============================

REM Example 1: Basic benchmark with default settings
echo.
echo 📝 Example 1: Basic benchmark with default settings
echo set API_BASE=http://localhost:3000/api ^& set ACCESS_TOKEN=your-token ^& node scripts/bench-tasks.js

REM Example 2: Custom iterations and timeout
echo.
echo 📝 Example 2: Custom iterations and timeout
echo set API_BASE=http://localhost:3000/api ^& set ACCESS_TOKEN=your-token ^& set ITERATIONS=20 ^& set TIMEOUT=15000 ^& node scripts/bench-tasks.js

REM Example 3: Production environment
echo.
echo 📝 Example 3: Production environment
echo set API_BASE=https://api.taskie.com/api ^& set ACCESS_TOKEN=prod-token ^& set USER_ID=user123 ^& node scripts/bench-fetch.js

REM Example 4: Staging environment with debug
echo.
echo 📝 Example 4: Staging environment with debug
echo set API_BASE=https://staging-api.taskie.com/api ^& set ACCESS_TOKEN=staging-token ^& set DEBUG=1 ^& node scripts/bench-tasks.js

REM Example 5: Using npm scripts
echo.
echo 📝 Example 5: Using npm scripts
echo npm run bench:tasks
echo npm run bench:fetch
echo npm run bench:all

REM Example 6: Environment file
echo.
echo 📝 Example 6: Using environment file
echo Create .env file with:
echo API_BASE=http://localhost:3000/api
echo ACCESS_TOKEN=your-access-token
echo USER_ID=your-user-id
echo ITERATIONS=15
echo TIMEOUT=10000
echo.
echo Then run:
echo node scripts/bench-tasks.js

echo.
echo ✅ Examples completed!
echo Choose the configuration that best fits your testing needs.

pause
