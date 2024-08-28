#!/bin/bash
export COMPOSE_PROJECT_NAME="ditproduction"
if [[ $1 == "" ]]
then
    echo "Version not found. Please specify a valid DIT version e.g 1.3.9";
    exit 1
fi
time docker-compose -f docker-compose-production.yml pull
if [[ $? -ne 0 ]]
then
    exit 1
fi
time UPGRADE_VERSION=$1 docker-compose -f docker-compose-production.yml up -d
