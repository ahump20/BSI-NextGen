FROM mcr.microsoft.com/devcontainers/typescript-node:20-bookworm

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl \
    git \
    jq \
    postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    wrangler \
    pnpm \
    tsx \
    nodemon

# Set up user
USER node

# Configure Git
RUN git config --global init.defaultBranch main

WORKDIR /workspaces/Sandlot-Sluggers
