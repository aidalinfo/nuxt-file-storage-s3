#!/bin/sh
set -e

GARAGE="docker exec garage /garage"
BUCKET="my-bucket"
KEY_NAME="nuxt-app-key"

echo "Waiting for Garage to be ready..."
until $GARAGE status > /dev/null 2>&1; do
  sleep 1
done

echo "Garage is ready."

# Get node ID
NODE_ID=$($GARAGE node id 2>/dev/null | head -1 | cut -d'@' -f1)
echo "Node ID: $NODE_ID"

# Setup layout (single node, zone dc1, capacity 1GB)
echo "Assigning layout..."
$GARAGE layout assign -z dc1 -c 1G "$NODE_ID"
$GARAGE layout apply --version 1

# Create bucket
echo "Creating bucket '$BUCKET'..."
$GARAGE bucket create "$BUCKET" 2>/dev/null || echo "Bucket already exists."

# Create access key
echo "Creating key '$KEY_NAME'..."
KEY_OUTPUT=$($GARAGE key create "$KEY_NAME" 2>/dev/null || $GARAGE key info "$KEY_NAME")

# Allow key on bucket
echo "Granting access..."
$GARAGE bucket allow --read --write --owner "$BUCKET" --key "$KEY_NAME"

echo ""
echo "=== Setup complete ==="
echo ""
$GARAGE key info "$KEY_NAME"
echo ""
echo "S3 endpoint : http://localhost:3900"
echo "Region      : garage"
echo "Bucket      : $BUCKET"
