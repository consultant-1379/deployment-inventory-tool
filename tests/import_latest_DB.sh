#!/bin/bash
# This script is used to restore the latest backed up data and logging DBs from DIT.
# Note:
# - Has to be run outside the container and run locally.
# - To import latest data and logging DBs use: ./import_latest_DB.sh ditdevelopment_default

LOCATIONS=("/export/DIT/" "/export/DITLOG/")

cd $(dirname $0)
for LOCATION in "${LOCATIONS[@]}"
do
    echo "Finding latest backed up DB in $LOCATION"
    LATEST=`sshpass -pstratus@dmin ssh root@atvdit.athtem.eei.ericsson.se -oStrictHostKeyChecking=no ls -lrt $LOCATION | grep -oe "[0-9]\{14\}" | tail -1`
    echo "Found $LATEST, copying to local location"
    sshpass -pstratus@dmin scp -r root@atvdit.athtem.eei.ericsson.se:$LOCATION$LATEST .
    echo "Restoring database from $LATEST..."
    .././restore_mongodb_backup.sh $PWD"/$LATEST" $1
    echo "Cleaning up DB files and folders..."
    rm -rf $LATEST
done
