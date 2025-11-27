#!/bin/bash

echo "Testing Claude AI chat without city specification..."
echo "======================================================="
echo ""

# Test 1: Request without city (should ask for city)
echo "Test 1: Message without city specification"
echo "Request: 'букет жене на день матери'"
echo ""
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "букет жене на день матери"
  }' 2>/dev/null | python3 -m json.tool

echo ""
echo "======================================================="
echo ""

# Test 2: Request with city (should search for products)
echo "Test 2: Message with city specification"
echo "Request: 'ищу букет жене на день матери в городе Нефтекамск'"
echo ""
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ищу букет жене на день матери в городе Нефтекамск"
  }' 2>/dev/null | python3 -m json.tool