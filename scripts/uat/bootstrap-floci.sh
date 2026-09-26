#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

APPLICATIONS_TABLE="${APPLICATIONS_TABLE:-zoa-applications-uat}"
DOCUMENTS_BUCKET="${DOCUMENTS_BUCKET:-zoa-documents-uat}"

echo "Waiting for Floci at ${AWS_ENDPOINT_URL}..."
for i in $(seq 1 60); do
  if curl -sf "${AWS_ENDPOINT_URL}/_localstack/health" >/dev/null 2>&1 ||
    curl -sf "${AWS_ENDPOINT_URL}/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

aws_cli() {
  aws --endpoint-url "$AWS_ENDPOINT_URL" "$@"
}

if ! aws_cli dynamodb describe-table --table-name "$APPLICATIONS_TABLE" >/dev/null 2>&1; then
  echo "Creating DynamoDB table ${APPLICATIONS_TABLE}..."
  aws_cli dynamodb create-table \
    --table-name "$APPLICATIONS_TABLE" \
    --attribute-definitions \
      AttributeName=pk,AttributeType=S \
      AttributeName=sk,AttributeType=S \
      AttributeName=gsi1pk,AttributeType=S \
      AttributeName=gsi1sk,AttributeType=S \
      AttributeName=gsiAdminPk,AttributeType=S \
      AttributeName=gsiAdminSk,AttributeType=S \
      AttributeName=id,AttributeType=S \
    --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --global-secondary-indexes \
      '[
        {
          "IndexName": "gsi1",
          "KeySchema": [
            {"AttributeName": "gsi1pk", "KeyType": "HASH"},
            {"AttributeName": "gsi1sk", "KeyType": "RANGE"}
          ],
          "Projection": {"ProjectionType": "ALL"}
        },
        {
          "IndexName": "gsi-admin",
          "KeySchema": [
            {"AttributeName": "gsiAdminPk", "KeyType": "HASH"},
            {"AttributeName": "gsiAdminSk", "KeyType": "RANGE"}
          ],
          "Projection": {"ProjectionType": "ALL"}
        },
        {
          "IndexName": "gsi-by-id",
          "KeySchema": [
            {"AttributeName": "id", "KeyType": "HASH"}
          ],
          "Projection": {"ProjectionType": "ALL"}
        }
      ]'
  aws_cli dynamodb wait table-exists --table-name "$APPLICATIONS_TABLE"
else
  echo "DynamoDB table ${APPLICATIONS_TABLE} already exists."
fi

if ! aws_cli s3api head-bucket --bucket "$DOCUMENTS_BUCKET" 2>/dev/null; then
  echo "Creating S3 bucket ${DOCUMENTS_BUCKET}..."
  aws_cli s3 mb "s3://${DOCUMENTS_BUCKET}"
else
  echo "S3 bucket ${DOCUMENTS_BUCKET} already exists."
fi

echo "Configuring S3 CORS for browser uploads..."
aws_cli s3api put-bucket-cors --bucket "$DOCUMENTS_BUCKET" --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://127.0.0.1:3000"],
      "AllowedMethods": ["GET", "PUT", "HEAD", "POST"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "Floci bootstrap complete."
