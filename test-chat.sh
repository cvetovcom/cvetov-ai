#!/bin/bash

# Тестовый скрипт для проверки чата

echo "Тестирование чата Цветов.ру AI"
echo "=============================="
echo ""

# Тестовое сообщение
MESSAGE="Покажи букеты роз до 5000 рублей"
CITY="Москва"

echo "Отправка запроса: \"$MESSAGE\""
echo "Город: $CITY"
echo ""

# Отправка запроса к API
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-jwt-token" \
  -d "{
    \"message\": \"$MESSAGE\",
    \"city\": \"$CITY\"
  }" | python3 -m json.tool

echo ""
echo "=============================="
echo "Тест завершен"