# Use a Rust slim base image for building
FROM rust:1.86.0-slim AS builder

# Install build dependencies for libp2p-core (protoc) and zstd-sys (libclang)
RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    protobuf-compiler \
    clang \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy project files
COPY ./ ./

# Build the application in release mode for ARM64
RUN cargo build --release --target aarch64-unknown-linux-gnu

# Create a minimal runtime image with fewer vulnerabilities
FROM debian:testing-slim AS runtime

# Update packages to patch vulnerabilities and install minimal runtime dependencies
RUN apt-get update -y \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        libssl3 \
        ca-certificates \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Create directories and symbolic links for persistent storage
RUN mkdir -p /usr/src/app/data/mydb /usr/src/app/data/logs \
    && ln -s /usr/src/app/data/mydb /usr/src/app/mydb \
    && ln -s /usr/src/app/data/logs /usr/src/app/logs

# Copy the built binary from the builder stage
COPY --from=builder /usr/src/app/target/aarch64-unknown-linux-gnu/release/node ./node

# Create non-root user and set ownership
RUN useradd -m -u 1001 solad \
    && chown -R solad:solad /usr/src/app

# Switch to non-root user
USER solad

# Expose ports for HTTP server (8080) and libp2p networking (4001)
EXPOSE 8080 4001

# Health check to verify the application is running every 10 minutes
HEALTHCHECK --interval=10m --timeout=5s --start-period=30s --retries=3 \
CMD curl -f http://localhost:8080/health || exit 1

# Command to run the application
CMD ["./node"]
