#!/bin/bash

# Configuration - Replace these with your actual values
TARGET_USER="fmc"
TARGET_HOST="macmini"
TARGET_PATH="/Users/fmc/docker/chat-fmc-ai"  # Use absolute path instead of ~ to avoid expansion issues

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Error handling function
handle_error() {
    echo -e "${RED}ERROR: $1${NC}"
    exit 1
}

echo -e "${GREEN}Starting deployment process...${NC}"

# Create a temporary directory for the deployment package
TEMP_DIR=$(mktemp -d) || handle_error "Failed to create temporary directory"
PACKAGE_NAME="nextchat-deploy.tar.gz"

echo -e "${GREEN}Creating deployment package...${NC}"

# Create the tar.gz package excluding common files that should not be deployed
# Excluding node_modules, .next, build directories, and other common ignored files
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='out' \
    --exclude='build' \
    --exclude='.DS_Store' \
    --exclude='*.pem' \
    --exclude='*.log' \
    --exclude='.env*.local' \
    --exclude='*.key' \
    --exclude='*.key.pub' \
    -czf "${TEMP_DIR}/${PACKAGE_NAME}" . || handle_error "Failed to create deployment package"

echo -e "${GREEN}Uploading package to ${TARGET_HOST}...${NC}"

# Check if the target directory exists on the remote server
ssh "${TARGET_USER}@${TARGET_HOST}" "mkdir -p ${TARGET_PATH}" || handle_error "Failed to create target directory on remote server"

# Upload the package to the target server
scp "${TEMP_DIR}/${PACKAGE_NAME}" "${TARGET_USER}@${TARGET_HOST}:${TARGET_PATH}/" || handle_error "Failed to upload package to remote server"

echo -e "${GREEN}Deploying on remote server...${NC}"

# Connect to the remote server and perform deployment steps
ssh -T "${TARGET_USER}@${TARGET_HOST}" << EOF || handle_error "Remote deployment failed"
    set -e  # Exit immediately if a command exits with a non-zero status
    
    echo "Changing to target directory: ${TARGET_PATH}"
    cd "${TARGET_PATH}" || { echo "Failed to change to target directory"; exit 1; }
    
    # Verify the package exists
    if [ ! -f "${PACKAGE_NAME}" ]; then
        echo "Package ${PACKAGE_NAME} not found in ${TARGET_PATH}"
        exit 1
    fi
    
    # Create a backup of the current deployment if it exists
    if [ -d "current" ]; then
        echo "Creating backup of current deployment..."
        mv current previous_\$(date +%Y%m%d%H%M%S) || { echo "Failed to create backup"; exit 1; }
    fi
    
    # Create a new directory for this deployment
    echo "Creating deployment directory..."
    mkdir -p current || { echo "Failed to create deployment directory"; exit 1; }
    
    # Extract the package
    echo "Extracting package..."
    tar -xzf "${PACKAGE_NAME}" -C current || { echo "Failed to extract package"; exit 1; }
    
    # Navigate to the deployment directory
    echo "Changing to deployment directory..."
    cd current || { echo "Failed to change to deployment directory"; exit 1; }
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        echo "docker-compose.yml not found in the extracted package"
        exit 1
    fi
    
    # Run docker-compose
    echo "Starting docker-compose..."
    docker-compose down || echo "Warning: docker-compose down failed, continuing anyway"
    docker-compose --profile no-proxy up -d --build --remove-orphans || { echo "Failed to start docker-compose"; exit 1; }
    
    # Clean up
    echo "Cleaning up..."
    cd .. || { echo "Failed to change directory for cleanup"; exit 1; }
    rm "${PACKAGE_NAME}" || { echo "Failed to remove package file"; exit 1; }
    
    echo "Deployment completed successfully!"
EOF

# Check if the SSH command was successful
if [ $? -ne 0 ]; then
    handle_error "Deployment on remote server failed"
fi

# Clean up local temporary files
echo -e "${GREEN}Cleaning up local temporary files...${NC}"
rm -rf "${TEMP_DIR}" || handle_error "Failed to clean up local temporary files"

echo -e "${GREEN}Deployment process completed!${NC}" 