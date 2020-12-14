# This Dockerfile builds a Brigade-compatible Kaniko image.
#
# The upstream Kaniko image is itself derived from scratch. As such, it has no
# shell and is therefore not compatible with Brigade 1.x, which implicitly
# requires all images used for jobs to have a shell.
#
# Our custom image copies the binary from the upstream Kaniko image to a new
# image derived from Debian.
#
# We also add in the docker-ce-cli package so that `docker login` can be used.
#
# See:
# https://github.com/GoogleContainerTools/kaniko/blob/v1.3.0/deploy/Dockerfile

FROM gcr.io/kaniko-project/executor:v1.3.0 as base

FROM debian:buster

ENV SSL_CERT_DIR=/etc/ssl/certs
# This path seems to be hardcoded in the kaniko binary. Don't change it.
ENV DOCKER_CONFIG /kaniko/.docker/

WORKDIR /workspace

# Copy the binary only from stock Kaniko image
COPY --from=base /kaniko/executor /usr/local/bin/kaniko

# Install make and docker-ce-cli
RUN buildDeps="apt-transport-https curl gnupg-agent gnupg2 software-properties-common" \
  && apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y --no-install-recommends \
    $buildDeps \
    ca-certificates \
    make \
  && curl -fsSLk https://download.docker.com/linux/debian/gpg | apt-key add \
  && add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/debian \
    $(lsb_release -cs) \
    stable" \
  && apt-get update \
  && apt-get install docker-ce-cli \
  && apt-get purge -y --auto-remove $buildDeps \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

CMD ["kaniko"]
