#!/bin/bash
export COMPOSE_PROJECT_NAME="ditproduction"
if [[ $1 == "" ]]
then
    echo "Version incorrect or not found. Please specify a valid DIT version e.g 1.3.9";
    exit 1
fi
time UPGRADE_VERSION=$1 docker-compose -f docker-compose-production.yml pull
if [[ $? -ne 0 ]]
then
    exit 1
fi
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
${SCRIPTDIR}/create_mongodb_backup.sh
if [[ $? -ne 0 ]]
then
    exit 1
fi
time UPGRADE_VERSION=$1 docker-compose -f docker-compose-production.yml up -d

./health_check.sh
