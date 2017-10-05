#!/bin/bash
# This script is for use when writing tests to quickly re-create an empty database

echo "* Removing existing RethinkDB container if present"
docker stop acl-rethink-test >/dev/null 2>&1 || true > /dev/null && docker rm acl-rethink-test >/dev/null 2>&1 || true > /dev/null

# start the rethinkdb container
echo "* Starting RethinkDB container on port 28025"
docker run --name acl-rethink-test -p 28025:28015 -p 28026:8080 -d rethinkdb > /dev/null