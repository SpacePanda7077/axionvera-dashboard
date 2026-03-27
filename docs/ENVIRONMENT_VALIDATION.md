# Environment Variable Validation

This document describes the environment variable validation system that ensures all required environment variables are present before the application starts.

## Overview

The application includes a pre-execution guard that validates the environment configuration and provides clear feedback to developers when required variables are missing.

## Features

- ✅ **Automatic Validation**: Runs before `npm run dev` and `npm run build`
- ✅ **Clear Error Messages**: Detailed feedback when validation fails
- ✅ **Production Checks**: Additional validation for production builds
- ✅ **Sensitive Data Masking**: Contract IDs and keys are masked in output
- ✅ **Template-Based**: Uses `.env.example` as the source of truth

## How It Works

### Validation Script

The `scripts/validate-env.js` script:

1. **Parses `.env.example`**: Extracts all required environment variables
2. **Compares with `process.env`**: Checks each variable is present and non-empty
3. **Provides Feedback**: Shows missing variables with clear instructions
4. **Exits on Failure**: Prevents application startup with non-zero exit code

### NPM Integration

The validation is automatically integrated into your development workflow:

```json
{
  "scripts": {
    "validate-env": "node scripts/validate-env.js",
    "predev": "npm run validate-env",
    "dev": "next dev",
    "prebuild": "npm run validate-env -- --production",
    "build": "next build"
  }
}
```

## Usage

### Development

```bash
# Start development server (validation runs automatically)
npm run dev

# Run validation manually
npm run validate-env
```

### Production Build

```bash
# Build for production (with additional checks)
npm run build

# Run production validation manually
npm run validate-env -- --production
```

## Required Environment Variables

Based on `.env.example`, the following variables are required:

```bash
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID=
NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID=
```

## Error Scenarios

### Missing Variables

```
🚨 FATAL: Environment validation failed!

Missing variables: NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID, NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID

To fix this issue:
1. Copy .env.example to .env: cp .env.example .env
2. Fill in the missing values in your .env file
3. Restart your development server

Required variables can be found in .env.example
```

### Production Validation Failure

```
🚨 PRODUCTION VALIDATION FAILED: Contract IDs

Contract IDs must be provided for production builds

Please ensure your production environment is properly configured.
```

### Success Case

```
🔍 Validating environment variables...

📋 Found 5 required environment variables:
   - NEXT_PUBLIC_STELLAR_NETWORK
   - NEXT_PUBLIC_SOROBAN_RPC_URL
   - NEXT_PUBLIC_HORIZON_URL
   - NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID
   - NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID

✅ All required environment variables are present!

📊 Current environment configuration:
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
   NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
   NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID=CDLZFC3SYJYD5T5Z3...N2K2I
   NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID=AAAAAAAAAAAAAAAA...AEDXG
```

## Setup Instructions

### 1. Create Environment File

```bash
# Copy the template
cp .env.example .env
```

### 2. Fill in Required Values

Edit `.env` with your actual values:

```bash
# Stellar network configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org

# Contract addresses (replace with actual contract IDs)
NEXT_PUBLIC_AXIONVERA_VAULT_CONTRACT_ID=YOUR_VAULT_CONTRACT_ID
NEXT_PUBLIC_AXIONVERA_TOKEN_CONTRACT_ID=YOUR_TOKEN_CONTRACT_ID
```

### 3. Start Development

```bash
npm run dev
```

The validation will run automatically and ensure everything is configured correctly.

## Advanced Usage

### Manual Validation

```javascript
const { validateEnvironment, validateEnvironmentForBuild } = require('./scripts/validate-env.js');

// Basic validation
validateEnvironment();

// Production validation
validateEnvironmentForBuild(true);
```

### Custom Error Handling

```javascript
const { validateEnvironment, FatalError } = require('./scripts/validate-env.js');

try {
  validateEnvironment();
  console.log('Environment is valid!');
} catch (error) {
  if (error instanceof FatalError) {
    console.error('Configuration error:', error.message);
    process.exit(1);
  }
}
```

## Troubleshooting

### Common Issues

1. **`.env.example` not found**: Ensure the file exists in the project root
2. **Permission denied**: Make sure the script is executable (`chmod +x scripts/validate-env.js`)
3. **Node version issues**: Ensure you're using a supported Node.js version

### Debug Mode

For additional debugging, you can run the script with Node's debug flag:

```bash
node --inspect scripts/validate-env.js
```

## Security Considerations

- **Sensitive Data**: Contract IDs and sensitive values are masked in output
- **No Secrets**: The script only checks for presence, not validity of secrets
- **Local Only**: Validation runs locally and doesn't expose any environment data

## Contributing

When adding new environment variables:

1. Update `.env.example` with the new variable
2. The validation script will automatically detect it
3. Update this documentation if needed

The validation system is designed to be zero-maintenance - any changes to `.env.example` are automatically picked up.
