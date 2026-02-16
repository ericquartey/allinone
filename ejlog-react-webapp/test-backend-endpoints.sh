#!/bin/bash

# Script per testare vari endpoint possibili del backend Java su porta 3077

echo "=================================="
echo "Backend Endpoint Discovery Script"
echo "=================================="
echo ""

BACKEND="http://localhost:3077"

echo "Testing various endpoint patterns..."
echo ""

# Array di path possibili
endpoints=(
  "/"
  "/Stock"
  "/api"
  "/api/Stock"
  "/api/items"
  "/rest"
  "/rest/Stock"
  "/EjLogHostVertimag"
  "/EjLogHostVertimag/Stock"
  "/EjLogHostVertimag/api"
  "/EjLogHostVertimag/api/Stock"
  "/EjLogHostVertimag/rest"
  "/EjLogHostVertimag/User/Login"
  "/EjLogHostVertimag/swagger-ui.html"
  "/EjLogHostVertimag/api-docs"
  "/swagger-ui.html"
  "/api-docs"
  "/health"
  "/status"
  "/v1/Stock"
  "/v1/items"
)

# Test ogni endpoint
for endpoint in "${endpoints[@]}"; do
  echo -n "Testing: $endpoint ... "

  response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND$endpoint" 2>&1)

  if [ "$response" = "200" ]; then
    echo -e "\e[32m200 OK\e[0m ✓"
  elif [ "$response" = "404" ]; then
    echo -e "\e[31m404 Not Found\e[0m"
  elif [ "$response" = "500" ]; then
    echo -e "\e[33m500 Server Error\e[0m"
  elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
    echo -e "\e[33m$response Auth Required\e[0m (endpoint exists!)"
  else
    echo -e "\e[90m$response\e[0m"
  fi
done

echo ""
echo "=================================="
echo "Testing with query parameters..."
echo "=================================="
echo ""

# Test con parametri
params_endpoints=(
  "/Stock?limit=1"
  "/api/Stock?limit=1"
  "/EjLogHostVertimag/Stock?limit=1"
  "/EjLogHostVertimag/api/Stock?limit=1"
)

for endpoint in "${params_endpoints[@]}"; do
  echo -n "Testing: $endpoint ... "

  response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND$endpoint" 2>&1)

  if [ "$response" = "200" ]; then
    echo -e "\e[32m200 OK\e[0m ✓"
  elif [ "$response" = "404" ]; then
    echo -e "\e[31m404 Not Found\e[0m"
  elif [ "$response" = "500" ]; then
    echo -e "\e[33m500 Server Error\e[0m"
  elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
    echo -e "\e[33m$response Auth Required\e[0m (endpoint exists!)"
  else
    echo -e "\e[90m$response\e[0m"
  fi
done

echo ""
echo "=================================="
echo "Checking server info..."
echo "=================================="
echo ""

echo "Server header:"
curl -s -I "$BACKEND/" | grep -i "server"

echo ""
echo "=================================="
echo "Done!"
echo "=================================="

