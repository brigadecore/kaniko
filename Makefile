SHELL ?= /bin/bash

.DEFAULT_GOAL := build

################################################################################
# Version details                                                              #
################################################################################

# This will reliably return the short SHA1 of HEAD or, if the working directory
# is dirty, will return that + "-dirty"
GIT_VERSION = $(shell git describe --always --abbrev=7 --dirty --match=NeVeRmAtCh)

################################################################################
# Docker images we build and publish                              #
################################################################################

ifdef DOCKER_REGISTRY
	DOCKER_REGISTRY := $(DOCKER_REGISTRY)/
endif

ifdef DOCKER_ORG
	DOCKER_ORG := $(DOCKER_ORG)/
endif

DOCKER_IMAGE_PREFIX := $(DOCKER_REGISTRY)$(DOCKER_ORG)

ifdef VERSION
	MUTABLE_DOCKER_TAG := latest
else
	VERSION            := $(GIT_VERSION)
	MUTABLE_DOCKER_TAG := edge
endif

IMMUTABLE_DOCKER_TAG := $(VERSION)

################################################################################
# Build                                                                        #
################################################################################

.PHONY: build
build:
	docker build \
		-t $(DOCKER_IMAGE_PREFIX)kaniko:$(IMMUTABLE_DOCKER_TAG) \
		.
	docker tag $(DOCKER_IMAGE_PREFIX)kaniko:$(IMMUTABLE_DOCKER_TAG) $(DOCKER_IMAGE_PREFIX)kaniko:$(MUTABLE_DOCKER_TAG)

################################################################################
# Publish                                                                      #
################################################################################

.PHONY: push
push: build
	docker login $$DOCKER_REGISTRY -u $$DOCKER_USERNAME -p $$DOCKER_PASSWORD
	docker push $(DOCKER_IMAGE_PREFIX)kaniko:$(IMMUTABLE_DOCKER_TAG)
	docker push $(DOCKER_IMAGE_PREFIX)kaniko:$(MUTABLE_DOCKER_TAG)
