echo "Booting server..."
node ../server.js > /dev/null &
serverPid=$!

echo "Running tests..."
redis-cli flushall
sleep 1
mocha redisTests.js

redis-cli flushall
sleep 1
../casperjs/bin/casperjs test roster_end2end.js

redis-cli flushall
sleep 1
../casperjs/bin/casperjs test sharedcode_end2end.js 

redis-cli flushall
sleep 1
../casperjs/bin/casperjs test welcome_end2end.js 

redis-cli flushall
sleep 1
../casperjs/bin/casperjs test sharelink_end2end.js

echo "Stopping server..."
kill $serverPid

