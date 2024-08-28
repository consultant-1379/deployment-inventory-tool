FROM armdocker.seli.gic.ericsson.se/dockerhub-ericsson-remote/ubuntu:14.04

RUN apt-get update \
  && apt-get install -y software-properties-common curl apt-transport-https \
  && add-apt-repository ppa:webupd8team/java \
  && apt-get update \
  && echo "oracle-java8-installer shared/accepted-oracle-license-v1-1 select true" | debconf-set-selections \
  && apt-get install -y oracle-java8-installer \
  && curl -O https://raw.githubusercontent.com/spinnaker/halyard/master/install/stable/InstallHalyard.sh \
  && useradd -m halyard
ENV TERM=xterm \
  DEBIAN_FRONTEND=noninteractive
COPY service /usr/sbin/service
RUN bash InstallHalyard.sh --user halyard -y \
  && usermod -aG sudo halyard \
  && curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl \
  && chmod +x ./kubectl \
  && mv ./kubectl /usr/local/bin/kubectl
COPY service /usr/sbin/service
USER halyard
ENTRYPOINT service halyard start \
  && sleep infinity
