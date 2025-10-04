#!/bin/bash

# Authentication Endpoints Performance Test (curl version)
# Tests /auth/login and /auth/google endpoints with mock credentials

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"
ITERATIONS=10
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Authentication Endpoints Performance Test${NC}"
echo -e "${BLUE}🌐 Base URL: ${BASE_URL}${NC}"
echo -e "${BLUE}⏱️  Timeout: ${TIMEOUT}s${NC}"
echo -e "${BLUE}🔄 Iterations: ${ITERATIONS}${NC}"

# Mock credentials
LOGIN_DATA='{"email":"test@example.com","password":"testpassword123","remember":true}'
GOOGLE_DATA='{"mock":{"sub":"mock-1234567890","email":"mockuser@example.com","name":"Mock User"},"remember":true}'

# Function to measure response time
measure_curl() {
    local url="$1"
    local data="$2"
    local test_name="$3"
    
    echo -e "\n${YELLOW}🧪 Testing ${test_name}...${NC}"
    echo -e "${YELLOW}📍 URL: ${url}${NC}"
    echo -e "${YELLOW}🔄 Running ${ITERATIONS} iterations...${NC}\n"
    
    local total_time=0
    local success_count=0
    local times=()
    
    for i in $(seq 1 $ITERATIONS); do
        echo -n "⏳ Request ${i}/${ITERATIONS}... "
        
        # Measure time with curl
        start_time=$(date +%s%3N)
        
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
            -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $TIMEOUT \
            "$url" 2>/dev/null)
        
        end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        
        if [ "$response" -ge 200 ] && [ "$response" -lt 300 ]; then
            echo -e "${GREEN}✅ ${response_time}ms (${response})${NC}"
            success_count=$((success_count + 1))
            total_time=$((total_time + response_time))
            times+=($response_time)
        else
            echo -e "${RED}❌ ${response_time}ms (${response})${NC}"
        fi
        
        # Small delay between requests
        sleep 0.1
    done
    
    # Calculate statistics
    if [ $success_count -gt 0 ]; then
        avg_time=$((total_time / success_count))
        success_rate=$((success_count * 100 / ITERATIONS))
        
        # Calculate min/max
        min_time=${times[0]}
        max_time=${times[0]}
        for time in "${times[@]}"; do
            if [ $time -lt $min_time ]; then
                min_time=$time
            fi
            if [ $time -gt $max_time ]; then
                max_time=$time
            fi
        done
        
        # Calculate median
        IFS=$'\n' sorted_times=($(sort -n <<<"${times[*]}"))
        unset IFS
        median_index=$((success_count / 2))
        median_time=${sorted_times[$median_index]}
        
        echo -e "\n${BLUE}📊 ${test_name} Results:${NC}"
        echo -e "${BLUE}├─ Success Rate: ${success_rate}%${NC}"
        echo -e "${BLUE}├─ Total Requests: ${ITERATIONS}${NC}"
        echo -e "${BLUE}├─ Successful: ${success_count}${NC}"
        echo -e "${BLUE}├─ Average Response Time: ${avg_time}ms${NC}"
        echo -e "${BLUE}├─ Median Response Time: ${median_time}ms${NC}"
        echo -e "${BLUE}├─ Min Response Time: ${min_time}ms${NC}"
        echo -e "${BLUE}└─ Max Response Time: ${max_time}ms${NC}"
        
        # Performance assessment
        if [ $avg_time -lt 100 ]; then
            echo -e "${GREEN}🚀 Performance: Excellent (< 100ms)${NC}"
        elif [ $avg_time -lt 300 ]; then
            echo -e "${GREEN}✅ Performance: Good (< 300ms)${NC}"
        elif [ $avg_time -lt 1000 ]; then
            echo -e "${YELLOW}⚠️  Performance: Acceptable (< 1s)${NC}"
        else
            echo -e "${RED}🐌 Performance: Slow (> 1s)${NC}"
        fi
        
        # Store results for overall assessment
        echo "${avg_time},${success_rate}" >> /tmp/auth_test_results.txt
    else
        echo -e "\n${RED}❌ All requests failed for ${test_name}${NC}"
        echo "0,0" >> /tmp/auth_test_results.txt
    fi
}

# Clean up previous results
rm -f /tmp/auth_test_results.txt

# Test 1: Login endpoint
measure_curl "${API_BASE}/auth/login" "$LOGIN_DATA" "Login Endpoint"

# Test 2: Google auth endpoint
measure_curl "${API_BASE}/auth/google" "$GOOGLE_DATA" "Google Auth Endpoint"

# Overall assessment
echo -e "\n${BLUE}📈 Overall Assessment:${NC}"

if [ -f /tmp/auth_test_results.txt ]; then
    # Calculate overall averages
    total_avg=0
    total_success=0
    count=0
    
    while IFS=',' read -r avg success; do
        total_avg=$((total_avg + avg))
        total_success=$((total_success + success))
        count=$((count + 1))
    done < /tmp/auth_test_results.txt
    
    if [ $count -gt 0 ]; then
        overall_avg=$((total_avg / count))
        overall_success=$((total_success / count))
        
        echo -e "${BLUE}├─ Overall Average Response Time: ${overall_avg}ms${NC}"
        echo -e "${BLUE}├─ Overall Success Rate: ${overall_success}%${NC}"
        echo -e "${BLUE}└─ Test Environment: ${BASE_URL}${NC}"
    fi
fi

# Local development limitations
if [[ "$BASE_URL" == *"localhost"* ]]; then
    echo -e "\n${YELLOW}⚠️  Local Development Limitations:${NC}"
    echo -e "${YELLOW}├─ Results may not reflect production performance${NC}"
    echo -e "${YELLOW}├─ Network latency is minimal (localhost)${NC}"
    echo -e "${YELLOW}├─ Database queries may be faster (local DB)${NC}"
    echo -e "${YELLOW}├─ No CDN or load balancing effects${NC}"
    echo -e "${YELLOW}└─ Consider testing with production-like data volumes${NC}"
fi

echo -e "\n${GREEN}✅ Performance test completed!${NC}"

# Clean up
rm -f /tmp/auth_test_results.txt /tmp/response.json
