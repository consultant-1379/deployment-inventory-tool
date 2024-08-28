#!/bin/bash
export COMPOSE_PROJECT_NAME="ditdevelopment"
time docker-compose down --volumes
if [[ $? -ne 0 ]]
then
    echo ok
fi
time docker-compose build
if [[ $? -ne 0 ]]
then
    exit 1
fi
time docker-compose up --force-recreate
if [[ $? -ne 0 ]]
then
    exit 1
fi
