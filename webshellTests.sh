#!/bin/bash
docker exec -it $(docker ps --filter "ancestor=ditdevelopment_nodejs" -q) ./tests/styles.sh
docker exec -it $(docker ps --filter "ancestor=ditdevelopment_nodejs" -q) ./tests/server.sh
docker cp ditdevelopment_nodejs_1:/opt/mean.js/coverage .
