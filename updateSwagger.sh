#!/bin/bash
mkdir /tmp/swagger
cp modules/*/swagger/*.json /tmp/swagger/
CONTAINER_ID=`docker ps --filter "ancestor=ditdevelopment_swagger" -q`
docker cp /tmp/swagger/. $CONTAINER_ID:/opt/meanjs/swagger
docker exec $CONTAINER_ID sh -c "cd /opt/meanjs/swagger && gulp"
rm -rf /tmp/swagger