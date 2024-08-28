#!/bin/bash
#
# To restore to production database just provide the db folder:
# ./restore_mongodb_backup.sh <db_folder>
#
# To restore to a non production database, provide the db folder and the required network name:
# ./restore_mongodb_backup.sh <db_folder> ditdevelopment_default
#
BACKUP_DIR=$1
NETWORK=ditproduction_default
if [[ $BACKUP_DIR == "" ]] || [[ ! -d $BACKUP_DIR ]]
then
    echo "You must specify a valid directory to restore the database from"
    exit 1
fi
echo "Restoring mongodb database from directory $BACKUP_DIR"
if [[ $2 != "" ]]
then
    echo "Restoring via specified network ($2)"
    NETWORK=$2
fi
docker run --rm -i -v $BACKUP_DIR:/backup --network=$NETWORK armdocker.seli.gic.ericsson.se/dockerhub-ericsson-remote/mongo:4.0.14 mongorestore /backup --host mongodb --drop
