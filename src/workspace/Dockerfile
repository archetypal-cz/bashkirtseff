FROM ubuntu:24.04

# ============================================================
# Layer 1: System packages
# ============================================================
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    vim \
    byobu \
    tmux \
    curl \
    wget \
    ca-certificates \
    build-essential \
    openssh-client \
    openssh-server \
    locales \
    gnupg \
    sudo \
    less \
    jq \
    ripgrep \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# ============================================================
# Layer 2: Locales (UTF-8 for diary content in multiple languages)
# ============================================================
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    sed -i '/cs_CZ.UTF-8/s/^# //g' /etc/locale.gen && \
    sed -i '/fr_FR.UTF-8/s/^# //g' /etc/locale.gen && \
    sed -i '/uk_UA.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# ============================================================
# Layer 3: GitHub CLI
# ============================================================
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && apt-get install -y gh && \
    rm -rf /var/lib/apt/lists/*

# ============================================================
# Layer 4: Node.js 24.x
# ============================================================
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# ============================================================
# Layer 5: just (task runner)
# ============================================================
ARG JUST_VERSION=1.46.0
RUN curl -fsSL "https://github.com/casey/just/releases/download/${JUST_VERSION}/just-${JUST_VERSION}-x86_64-unknown-linux-musl.tar.gz" \
    | tar xz -C /usr/local/bin just

# ============================================================
# Layer 6: uv (Python toolchain)
# ============================================================
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# ============================================================
# Layer 7: code-server (VS Code in browser)
# ============================================================
RUN curl -fsSL https://code-server.dev/install.sh | sh

# ============================================================
# Layer 8: npm global packages
# ============================================================
RUN npm install -g \
    @anthropic-ai/claude-code \
    @google/gemini-cli \
    vibe-tools

# ============================================================
# Layer 9: code-server extensions
# ============================================================
RUN code-server --install-extension yzhang.markdown-all-in-one && \
    code-server --install-extension streetsidesoftware.code-spell-checker && \
    code-server --install-extension esbenp.prettier-vscode && \
    code-server --install-extension dbaeumer.vscode-eslint

# ============================================================
# Layer 10: Configuration & entrypoint
# ============================================================
RUN mkdir -p /root/.config/code-server

COPY code-server-config.yaml /root/.config/code-server/config.yaml
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# SSH server setup
RUN mkdir -p /run/sshd /root/.ssh && \
    chmod 700 /root/.ssh && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

WORKDIR /workspace

EXPOSE 2222 8080 4321 3000

LABEL org.opencontainers.image.source="https://github.com/archetypal-cz/bashkirtseff"
LABEL org.opencontainers.image.description="Bashkirtseff diary translation workspace"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["byobu"]
