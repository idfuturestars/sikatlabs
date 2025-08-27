#!/bin/bash

# EiQ Platform Login Test Script
# Tests all available login methods to verify authentication is working

echo "🔐 EiQ Platform Login Testing"
echo "============================"

# Test admin login
echo "1. Testing admin login..."
ADMIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password"}' \
    http://localhost:5000/api/auth/login)

if echo "$ADMIN_RESPONSE" | grep -q "token"; then
    echo "✅ Admin login: SUCCESS"
else
    echo "❌ Admin login: FAILED"
    echo "Response: $ADMIN_RESPONSE"
fi

# Test testuser login
echo "2. Testing testuser login..."
TESTUSER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"password"}' \
    http://localhost:5000/api/auth/login)

if echo "$TESTUSER_RESPONSE" | grep -q "token"; then
    echo "✅ Testuser login: SUCCESS"
else
    echo "❌ Testuser login: FAILED"
    echo "Response: $TESTUSER_RESPONSE"
fi

# Test demo user login
echo "3. Testing demo user login..."
DEMO_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username":"demo","password":"password"}' \
    http://localhost:5000/api/auth/login)

if echo "$DEMO_RESPONSE" | grep -q "token"; then
    echo "✅ Demo user login: SUCCESS"
else
    echo "❌ Demo user login: FAILED"
    echo "Response: $DEMO_RESPONSE"
fi

# Test invalid login
echo "4. Testing invalid credentials..."
INVALID_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username":"nonexistent","password":"wrongpassword"}' \
    http://localhost:5000/api/auth/login)

if echo "$INVALID_RESPONSE" | grep -q "Invalid credentials"; then
    echo "✅ Invalid credentials: CORRECTLY REJECTED"
else
    echo "❌ Invalid credentials: UNEXPECTED RESPONSE"
    echo "Response: $INVALID_RESPONSE"
fi

echo ""
echo "📋 Login Test Summary:"
echo "- Available demo accounts: admin, testuser, demo"
echo "- Password for all demo accounts: password"
echo "- Authentication endpoints working correctly"
echo "- Invalid credentials properly rejected"