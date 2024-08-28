#!/bin/bash
echo 'Starting Health-check'
cd SmokeTests

DIT_IP='atvdit.athtem.eei.ericsson.se'
docker build . -t smoketest --force-rm
docker run --rm -e "HEALTH_CHECK=true" -e "JENKINS=false" -e "BASE_URL=$DIT_IP" -e "TEST_USERNAME=dittest" -e "TEST_PASSWORD=otZPzm5craKQJ&IN" -v "$PWD"/images:/opt/SmokeTest/images smoketest
if [[ $? -ne 0 ]]
then
    echo 'Health-check Failed. Please review failures to determine the next steps.'
else
    echo 'Health-check Passed.'
fi
exit 0
