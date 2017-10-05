#!/bin/bash
# This test requires that you have docker and wget running on your machine

echo "* Build module"
npm run build > /dev/null
if [[ $? -ne 0 ]]; then
    echo "* ERROR: There was an error during build"
    exit 1
fi

# try removing the container
echo "* Removing existing RethinkDB container if present"
docker stop acl-rethink-test >/dev/null 2>&1 || true > /dev/null && docker rm acl-rethink-test >/dev/null 2>&1 || true > /dev/null

# start the rethinkdb container
echo "* Starting RethinkDB container on port 28025"
docker run --name acl-rethink-test -p 28025:28015 -p 28026:8080 -d rethinkdb > /dev/null

# test that the container is up and that the http interface is available
echo "* Testing that the RethinkDB server is available"
wget -q --tries=10 --timeout=20 -O - http://127.0.0.1:28026 > /dev/null

# check that the address was available
if [[ $? -ne 0 ]]; then
    echo "* ERROR: The RethinkDB container is not online so tests cannot be run. Please re-run."
    exit 1
else
    echo "* RethinkDB server started"
fi

# Run mocha tests
echo "* Running mocha tests"
npm run mocha:test

# try removing the container
echo "* Cleaning up RethinkDB container"
docker stop acl-rethink-test > /dev/null || true > /dev/null && docker rm acl-rethink-test > /dev/null || true > /dev/null