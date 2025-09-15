# PKPASS Format

## Apple Wallet Pass Format Specification

The .pkpass file is a ZIP archive containing specific files that Apple Wallet can read and display. This document outlines the complete format specification we implement.

## File Structure

```
sample.pkpass (ZIP archive)
├── pass.json          # Pass data (required)
├── manifest.json      # File hashes (required)
├── signature          # PKCS#7 signature (required)
├── icon.png          # 29×29 icon (required)
├── icon@2x.png       # 58×58 icon (required)
├── logo.png          # 160×50 logo (optional)
├── logo@2x.png       # 320×100 logo (optional)
├── strip.png         # 320×84 strip (optional)
├── strip@2x.png      # 640×168 strip (optional)
├── background.png    # 180×220 background (optional)
├── background@2x.png # 360×440 background (optional)
├── thumbnail.png     # 90×90 thumbnail (optional)
└── thumbnail@2x.png  # 180×180 thumbnail (optional)
```

## Required Files

### 1. pass.json

The main pass data file containing all pass information.

**Format**: UTF-8 JSON (no BOM)
**Encoding**: Base64-safe characters only
**Required Fields**:

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.example.wallet",
  "teamIdentifier": "1234567890",
  "organizationName": "Example Corp",
  "serialNumber": "unique-serial-number",
  "description": "Pass description",
  "backgroundColor": "rgb(60,65,80)",
  "foregroundColor": "rgb(255,255,255)",
  "labelColor": "rgb(255,255,255)",
  "generic": {
    "primaryFields": [
      {
        "key": "field1",
        "label": "Field Label",
        "value": "Field Value"
      }
    ],
    "secondaryFields": [...],
    "auxiliaryFields": [...],
    "backFields": [...]
  },
  "barcode": {
    "format": "PKBarcodeFormatQR",
    "message": "barcode-message",
    "messageEncoding": "utf-8",
    "altText": "Alternative text"
  }
}
```

**Field Types**:
- `primaryFields`: Most important information
- `secondaryFields`: Secondary information
- `auxiliaryFields`: Additional details
- `backFields`: Information on pass back

### 2. manifest.json

SHA-1 hash manifest for all files in the pass.

**Format**: UTF-8 JSON
**Purpose**: File integrity verification

```json
{
  "pass.json": "a1b2c3d4e5f6...",
  "icon.png": "f6e5d4c3b2a1...",
  "icon@2x.png": "1a2b3c4d5e6f...",
  "manifest.json": "6f5e4d3c2b1a..."
}
```

**Hash Algorithm**: SHA-1 (Apple requirement)
**Case**: Lowercase hexadecimal

### 3. signature

PKCS#7 detached signature of the manifest.json file.

**Format**: DER-encoded PKCS#7
**Purpose**: Cryptographic verification
**Requirements**:
- Detached signature (no content included)
- Includes signer certificate
- Includes Apple WWDR intermediate certificate
- No CRLs (Certificate Revocation Lists)

## Image Specifications

### Required Images

| File | Size | Purpose | Required |
|------|------|---------|----------|
| icon.png | 29×29 | Pass list icon | Yes |
| icon@2x.png | 58×58 | Retina pass list icon | Yes |

### Optional Images

| File | Size | Purpose | Required |
|------|------|---------|----------|
| logo.png | 160×50 | Pass logo | No |
| logo@2x.png | 320×100 | Retina pass logo | No |
| strip.png | 320×84 | Wide pass image | No |
| strip@2x.png | 640×168 | Retina wide pass image | No |
| background.png | 180×220 | Pass background | No |
| background@2x.png | 360×440 | Retina pass background | No |
| thumbnail.png | 90×90 | Pass thumbnail | No |
| thumbnail@2x.png | 180×180 | Retina pass thumbnail | No |

### Image Requirements

- **Format**: PNG only
- **Color Space**: sRGB
- **Alpha Channel**: Supported
- **Compression**: Lossless
- **Dimensions**: Exact pixel dimensions
- **File Size**: < 1MB per image

## Signing Process

### 1. Certificate Requirements

- **Pass Type ID Certificate**: P12 format with private key
- **Apple WWDR Certificate**: PEM format
- **Certificate Chain**: Must include intermediate certificates

### 2. Signing Steps

1. **Create manifest.json**: Calculate SHA-1 hash of each file
2. **Sign manifest**: Create PKCS#7 detached signature
3. **Include certificates**: Add signer and WWDR certificates
4. **Create signature file**: Write DER-encoded signature

### 3. OpenSSL Command

```bash
openssl cms -sign -detach -binary \
  -in manifest.json \
  -out signature \
  -signer pass.p12 \
  -inkey pass.p12 \
  -passin pass:password \
  -certfile AppleWWDRCAG3.pem \
  -outform DER
```

## Validation Process

### 1. File Structure Validation

- Valid ZIP archive
- All required files present
- No unexpected files
- Proper file naming

### 2. Content Validation

- **pass.json**: Valid JSON, required fields present
- **Images**: Valid PNG format, correct dimensions
- **Manifest**: Valid JSON, correct SHA-1 hashes
- **Signature**: Valid PKCS#7, proper certificate chain

### 3. Apple Wallet Validation

- Pass adds successfully to Apple Wallet
- Displays correctly on device
- Barcode scans properly
- Updates work (if applicable)

## Implementation Details

### File Generation Order

1. Generate pass.json from template and data
2. Process and validate images
3. Create manifest.json with SHA-1 hashes
4. Generate PKCS#7 signature
5. Create ZIP archive with all files

### Error Handling

- **Missing Files**: Return clear error messages
- **Invalid Images**: Validate dimensions and format
- **Signing Errors**: Handle certificate issues
- **ZIP Errors**: Validate archive creation

### Performance Considerations

- **Image Processing**: Use Sharp for efficient processing
- **Hash Calculation**: Stream files for large images
- **Memory Usage**: Process files individually
- **Caching**: Cache processed images

## Security Considerations

### Certificate Security

- Store certificates securely
- Use environment variables for passwords
- Rotate certificates regularly
- Monitor certificate expiration

### File Security

- Validate all uploaded files
- Scan for malicious content
- Limit file sizes
- Use secure file permissions

### Signature Security

- Use strong private keys
- Protect private key material
- Validate certificate chains
- Monitor for compromised certificates

## Troubleshooting

### Common Issues

1. **Pass won't add to wallet**
   - Check certificate validity
   - Verify signature format
   - Validate pass.json structure

2. **Images not displaying**
   - Check image dimensions
   - Verify PNG format
   - Validate file names

3. **Barcode not scanning**
   - Check message encoding
   - Verify barcode format
   - Test with different scanners

4. **Signature validation fails**
   - Check certificate chain
   - Verify WWDR certificate
   - Validate signing process

### Debug Tools

- **CLI validation**: `pnpm cli validate --file pass.pkpass`
- **ZIP inspection**: `unzip -l pass.pkpass`
- **Manifest check**: `cat manifest.json`
- **Signature check**: `openssl cms -verify -in signature -inform DER -content manifest.json`

## Apple Requirements Compliance

### Format Version

- Must be exactly `1`
- No other versions supported

### Pass Type Identifier

- Must start with `pass.`
- Must match Apple Developer registration
- Must be unique per team

### Team Identifier

- Must be exactly 10 characters
- Must match Apple Developer Team ID
- Must be numeric

### Serial Number

- Must be unique per pass type
- Can be any string format
- Used for pass updates

### Organization Name

- Displayed in pass
- Should match Apple Developer account
- Used for pass identification

### Description

- Brief description of pass
- Used for accessibility
- Should be descriptive

### Colors

- Must be valid CSS color format
- Should provide good contrast
- Consider accessibility

### Fields

- At least one field required
- Fields must have unique keys
- Values must be strings

### Barcode

- Must have valid format
- Message must be non-empty
- Encoding must be supported

## Future Considerations

### Apple Updates

- Monitor Apple documentation changes
- Update format as needed
- Test with new iOS versions
- Maintain backward compatibility

### Performance

- Optimize image processing
- Implement caching
- Use CDN for assets
- Monitor performance metrics

### Security

- Regular security audits
- Update dependencies
- Monitor for vulnerabilities
- Implement security best practices
