#!/bin/bash

# Example usage of API benchmarking scripts
# This script demonstrates how to run the benchmarks with different configurations

echo "🚀 API Benchmarking Examples"
echo "=============================="

# Example 1: Basic benchmark with default settings
echo -e "\n📝 Example 1: Basic benchmark with default settings"
echo "API_BASE='http://localhost:3000/api' ACCESS_TOKEN='your-token' node scripts/bench-tasks.js"

# Example 2: Custom iterations and timeout
echo -e "\n📝 Example 2: Custom iterations and timeout"
echo "API_BASE='http://localhost:3000/api' ACCESS_TOKEN='your-token' ITERATIONS='20' TIMEOUT='15000' node scripts/bench-tasks.js"

# Example 3: Production environment
echo -e "\n📝 Example 3: Production environment"
echo "API_BASE='https://api.taskie.com/api' ACCESS_TOKEN='prod-token' USER_ID='user123' node scripts/bench-fetch.js"

# Example 4: Staging environment with debug
echo -e "\n📝 Example 4: Staging environment with debug"
echo "API_BASE='https://staging-api.taskie.com/api' ACCESS_TOKEN='staging-token' DEBUG=1 node scripts/bench-tasks.js"

# Example 5: Using npm scripts
echo -e "\n📝 Example 5: Using npm scripts"
echo "npm run bench:tasks"
echo "npm run bench:fetch"
echo "npm run bench:all"

# Example 6: Environment file
echo -e "\n📝 Example 6: Using environment file"
echo "Create .env file with:"
echo "API_BASE=http://localhost:3000/api"
echo "ACCESS_TOKEN=your-access-token"
echo "USER_ID=your-user-id"
echo "ITERATIONS=15"
echo "TIMEOUT=10000"

echo -e "\nThen run:"
echo "source .env && node scripts/bench-tasks.js"

echo -e "\n✅ Examples completed!"
echo "Choose the configuration that best fits your testing needs."
