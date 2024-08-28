#!/bin/bash
# To upgrade production DIT to a specific version, use the following command:
# ./auto_upgrade.sh <version>
#
# Example:
# ./auto_upgrade.sh 1.3.9

UPGRADE_VERSION=$1

echo "Stopping Grafana and Prometheus containers";
cd ../dockprom
docker-compose down

echo "Going back to DIT folder";
cd ../deployment-inventory-tool

echo "Checking out the latest DIT code...";
git checkout -f master
git reset --hard origin/master
git pull -f

TAG=`git tag -l deployment-inventory-tool-$UPGRADE_VERSION`
if [[ $UPGRADE_VERSION == "" ]] || [[ $TAG == "" ]]
then
    echo "Version incorrect or not found. Please specify a valid DIT version e.g 1.3.9";
    exit 1
else
    echo "Running git checkout -f "$TAG;
    git checkout -f $TAG
fi

echo "NOTE: This script does not support versions lower than 1.3.1";
read -p "Are you sure you want to upgrade DIT to $UPGRADE_VERSION (Y/N)? " -n 1 -r
echo # move to a new line
if [[ $REPLY =~ ^[Y]$ ]]
then
    echo "Performing DIT upgrade...";
    cp SmokeTests/.env .
    ./upgrade.sh $UPGRADE_VERSION
    if [[ $? -ne 0 ]]
    then
        echo "DIT upgrade failed.";
    else
        echo "DIT upgrade complete.";
        echo "Starting Grafana and Prometheus containers";
        cd ../dockprom
        docker-compose up -d
    fi
else
    echo "DIT upgrade cancelled.";
fi

echo "Remove dangling Docker networks, containers and images..."
docker system prune -af
