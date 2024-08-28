#!/bin/bash
echo 'Starting Smoke Tests'
export COMPOSE_PROJECT_NAME="dittest"

cp SmokeTests/.env .
time docker-compose build
time docker-compose up -d --force-recreate

COUNTER=1

while [ "`docker inspect -f {{.State.Health.Status}} dittest_nginx_1`" != "healthy" ]; do
    if [ $COUNTER -gt 10 ]
    then
        echo "Container didn't reach healthy state. Exiting..."
        exit 1
    fi
    echo 'Checking if nginx container is healthy, attempt' $COUNTER'/10'
    sleep 5;
    ((COUNTER+=1))
done

DIT_IP=`docker inspect -f "{{ .NetworkSettings.Networks.dittest_default.Gateway }}" dittest_nginx_1`

# Run Smoke Tests
cd SmokeTests
./prepare_db_for_smoke_tests.sh dittest_default
docker build . -t smoketest --force-rm
docker run --rm -e "HEALTH_CHECK=false" -e "JENKINS=true" -e "BASE_URL=$DIT_IP" -e "TEST_USERNAME=dittest" -e "TEST_PASSWORD=otZPzm5craKQJ&IN" -v "$PWD"/images:/opt/SmokeTest/images -v "$PWD"/allure-results:/opt/SmokeTest/allure-results smoketest

if [[ $? -ne 0 ]]
then
    echo 'Smoke tests failed.'
    time docker-compose down --volumes
    exit 1
fi

# Populate DB for upgrade tests
cd .. && tests/./import_latest_DB.sh dittest_default

# Run Upgrade Document Tests
docker exec dittest_nodejs_1 tests/doc_upgrade.sh

if [[ $? -ne 0 ]]
then
    echo 'Document Upgrade Tests failed.'
    time docker-compose down --volumes
    exit 1
fi

time docker-compose down --volumes
