#!/bin/bash
echo 'Starting Smoke Tests'

COUNTER=1

while [ "`docker inspect -f {{.State.Health.Status}} ditdevelopment_nginx_1`" != "healthy" ]; do
    if [ $COUNTER -gt 10 ]
    then
        echo "Container didn't reach healthy state. Exiting..."
        exit 1
    fi
    echo 'Checking if nginx container is healthy, attempt' $COUNTER'/10'
    sleep 5;
    ((COUNTER+=1))
done

DIT_IP=`docker inspect -f "{{ .NetworkSettings.Networks.ditdevelopment_default.Gateway }}" ditdevelopment_nginx_1`

# Run Smoke Tests
cd SmokeTests
sudo rm -rf images/
./prepare_db_for_smoke_tests.sh ditdevelopment_default
docker build . -t smoketest --force-rm
docker run --rm -e "HEALTH_CHECK=false" -e "JENKINS=false" -e "BASE_URL=$DIT_IP" -e "TEST_USERNAME=dittest" -e "TEST_PASSWORD=otZPzm5craKQJ&IN" -v "$PWD"/images:/opt/SmokeTest/images -v "$PWD"/allure-results:/opt/SmokeTest/allure-results smoketest

if [[ $? -ne 0 ]]
then
    echo 'Smoke tests failed.'
    time docker-compose down --volumes
    exit 1
fi
