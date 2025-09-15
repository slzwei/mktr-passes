# Certificates

This directory contains Apple Wallet certificates for pass signing.

## Required Certificates

### 1. Pass Type ID Certificate (P12)
- **File**: `pass.p12`
- **Format**: PKCS#12
- **Contains**: Pass Type ID certificate + private key
- **Password**: Set in `APPLE_PASS_CERT_PASSWORD` environment variable

### 2. Apple WWDR Certificate (PEM)
- **File**: `AppleWWDRCAG3.pem`
- **Format**: PEM
- **Source**: Apple Worldwide Developer Relations Certification Authority

## Getting Certificates

### Pass Type ID Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Create a new Pass Type ID
4. Create a new certificate for the Pass Type ID
5. Download the certificate
6. Convert to P12 format with private key

### Apple WWDR Certificate

1. Download from [Apple's website](https://developer.apple.com/certificationauthority/AppleWWDRCA.cer)
2. Convert to PEM format:
   ```bash
   openssl x509 -inform DER -in AppleWWDRCA.cer -out AppleWWDRCAG3.pem
   ```

## Development Mode

For development and testing, you can use dummy certificates:

```bash
# Generate dummy certificates (development only)
openssl req -x509 -newkey rsa:2048 -keyout pass.key -out pass.crt -days 365 -nodes
openssl pkcs12 -export -out pass.p12 -inkey pass.key -in pass.crt -passout pass:dummy
cp pass.crt AppleWWDRCAG3.pem
```

**Note**: Dummy certificates will not work on real devices and are only for development.

## Security

- **Never commit real certificates** to version control
- Use environment variables for passwords
- Restrict file permissions: `chmod 600 *.p12 *.pem`
- Store certificates securely in production
- Rotate certificates before expiration

## Environment Variables

```bash
APPLE_PASS_CERT_P12=./infra/certs/pass.p12
APPLE_PASS_CERT_PASSWORD=your-password
APPLE_WWDR_CERT_PEM=./infra/certs/AppleWWDRCAG3.pem
```

## Troubleshooting

### Certificate Issues

1. **Invalid certificate**: Check file format and password
2. **Expired certificate**: Renew certificate in Apple Developer Portal
3. **Wrong certificate**: Ensure it matches your Pass Type ID
4. **Permission denied**: Check file permissions

### Common Errors

- `Failed to load certificates`: Check file paths and permissions
- `Invalid certificate format`: Ensure P12 and PEM formats
- `Certificate expired`: Check expiration dates
- `Wrong Pass Type ID`: Verify certificate matches identifier
