# Deployment Inventory Tool #

The DIT is primarily used to store and make available Site Engineering Documents which are required to deploy vENM.

It is also used to manage DO, NETSim, workload and DDP information.

More information on DIT available: https://atvdit.athtem.eei.ericsson.se/helpdocs/#help/app/helpdocs

# Prerequisites #

## Setting up Linux on VirtualBox ##

Download VirtualBox for Windows: https://www.virtualbox.org/

Download Linux Distribution ISO of your choice.

Disable Hyper-V: https://ugetfix.com/ask/how-to-disable-hyper-v-in-windows-10/

Install Linux in VirtualBox: https://itsfoss.com/install-linux-in-virtualbox/

You can enable copy/paste across Windows/Ubuntu:
> Devices -> Insert Guest Additions CD Image

> Machine -> Settings -> General -> Advanced -> Turn Shared Clipboard and Drag'n'Drop to Bindirectional

## Setting up Docker-Compose and Docker ##

Install curl:
`sudo apt-get install curl`

Install Docker-Compose:
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To verify Docker-Compose installation:
`docker-compose --version`

Install Docker:
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
sudo apt-get update
sudo apt-get install \apt-transport-https \ca-certificates \curl \gnupg-agent \software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \ "deb [arch=amd64] https://download.docker.com/linux/ubuntu \ $(lsb_release -cs) \stable
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To verify Docker installation:
`sudo docker run hello-world`

To run Docker without sudo:
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
sudo groupadd docker
sudo gpasswd -a $USER docker
sudo service docker restart
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Setting up Gerrit and Installing Git ##

Install Git: `sudo apt install git`

Generate ssh keys: `ssh-keygen -t rsa`

Get file: `cat ~/.ssh/id_rsa.pub`

Login to Gerrit:
> Log-in -> Settings -> SSH Publick Key -> Paste the key and "Add"

Copy the content inside the file id_rsa.pub and paste it to Gerrit

# .env Variables #

Before running the project in development mode, the .env file is required at the root of the project with the following contents (Note: See .env file in SmokeTests folder for up to date contents):
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
LDAP_URL=<LDAP_URL>:<PORT>
BASE_DN_LIST=<Base DN list to authtenticate against, seperated by ":". Min of 1 required.>
SEARCH_FILTER=<(name={{username}})>
PARAMETER_DEFAULTS_APPLICATION=dittest
JIRA_HOST=jira-oss.seli.wh.rnd.internal.ericsson.com
JIRA_USERNAME=DTTADM100
JIRA_PASSWORD=
TEAM_EMAIL=PDLCIINFRA@pdl.internal.ericsson.com
DIT_EMAIL_ADDRESS=no-reply-dit@ericsson.com
DTT_EMAIL_ADDRESS=no-reply-dtt@ericsson.com
DTT_EMAIL_PASSWORD=
UPGRADE_TOOL_URL=http://atvts2716.athtem.eei.ericsson.se
IPV6REGEX=^(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})?)$
IPV4REGEX=^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Deployment #

Run dev.sh:
`./cd deployment-inventory-tool/dev.sh`

To verify: Navigate to 'localhost' and hit enter

To stop process: Ctrl+C in the terminal

Import the latest DB:
`./tests/import_latest_DB.sh ditdevelopment_default`

# Running the tests #

## Smoke Tests ##

With no containers running, call:
`./smokeAndUpgradeTests.sh`

**Note**: The above script is also used in Jenkinsfile for the FunctionalTests Jenkins Job, due some issues with tests being unstable on the slave/agent currently a '@jenkins' tag was placed on most of the tests to run most stable for the Jenkins slave/agent. Maybe can be removed when more stable vApp template is used otherwise use below script locally run all the tests found in smoke_test.js.

Or other option in development mode but only all of the smoke tests,
in a seperate terminal (whilst DIT is running) execute:
`./smoke_tests_on_dev.sh`

## Linting and Unit Tests ##

In a seperate terminal (whilst DIT is running):
`./webshell.sh`

In the DIT container command line:

Run server unit tests:
`./tests/server`

Run code unit linting:
`./tests/styles`

Or other option in development mode to run the spell check, linting & Unit Tests:
In a seperate terminal (whilst DIT is running) execute:
`./webshellTests.sh`

# Built With #

* [MEAN.js](http://meanjs.org) - Open-Source Full-Stack Solution For MEAN Applications
* [Angular Schema Form](https://github.com/json-schema-form/angular-schema-form) - Generate forms from a JSON schema, with AngularJS

# Change Log #

Change Log is available:
- Newer (six months worth using date range): https://arm1s11-eiffel004.eiffel.gic.ericsson.se:8443/nexus/content/sites/tor/deployment-inventory-tool/latest/changelog.html
- For Versions 3.32.0 and older: https://arm1s11-eiffel004.eiffel.gic.ericsson.se:8443/nexus/content/sites/tor/deployment-inventory-tool/latest/change_log.html

# Authors #

**EE CI Infra Team** - PDLCIINFRA@pdl.internal.ericsson.com

# License #

ERICSSON 2019
