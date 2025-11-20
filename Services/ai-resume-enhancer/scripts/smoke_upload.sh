#!/usr/bin/env bash
set -euo pipefail

API="http://localhost:8080"
FILE_PATH=${1:-"./sample.pdf"}

if [ ! -f "$FILE_PATH" ]; then
  echo "Sample file not found: $FILE_PATH"
  exit 1
fi

echo "Uploading $FILE_PATH"
RESP=$(curl -s -F "file=@${FILE_PATH};type=application/pdf" "$API/api/resume/upload?enhance=false")
echo "Upload response: $RESP"

RESUME_ID=$(echo "$RESP" | python -c "import sys, json; print(json.load(sys.stdin).get('resume_id',''))")
if [ -z "$RESUME_ID" ]; then
  echo "No resume_id returned"
  exit 1
fi

echo "Fetching parsed resume $RESUME_ID"
curl -s "$API/api/resume/$RESUME_ID" | jq .
