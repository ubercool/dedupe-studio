#!/bin/bash
echo "Testing Dedupe API..."

# Create a dummy CSV if it doesn't exist
if [ ! -f sample-data.csv ]; then
  echo "Creating sample-data.csv..."
  echo "firstName,lastName,email,company" > sample-data.csv
  echo "John,Doe,john@example.com,Acme Inc" >> sample-data.csv
  echo "John,Doe,john.doe@example.com,Acme Corp" >> sample-data.csv
  echo "Jane,Smith,jane@test.com,Test Co" >> sample-data.csv
fi

# Start the server in the background if not running (we'll assume user runs it or we run it)
# For this test, we'll assume the server is running on localhost:3000
# But wait, I can't easily start the server and keep it running in the background while I run this script in the same tool call sequence easily without blocking.
# I'll just use curl and assume I'll start the server separately or checking if it's up.
# Actually, I should start the server first.

# Let's just make this a curl command wrapper
curl -X POST -F "file=@sample-data.csv" http://localhost:3000/api/dedupe | grep "success" && echo "\nAPI Test Passed!" || echo "\nAPI Test Failed!"
