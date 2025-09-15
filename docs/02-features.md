# Features - Milestone 1 & Phase 2

## Core Features

### 1. Template System
- **Built-in Templates**: 3 restaurant-friendly templates
  - `stamp_card_v1`: Loyalty stamp card with progress tracking
  - `coupon_v1`: Discount coupon with expiry and barcode
  - `membership_v1`: Membership card with tier and member ID
- **Template DSL**: Expression-based field evaluation
- **Variable System**: Type-safe variable definitions with validation
- **Image Requirements**: Role-based image specifications with dimension validation

### 2. WYSIWYG Editor
- **Live Preview**: Real-time pass appearance simulation
- **Variable Forms**: Dynamic form generation based on template variables
- **Image Upload**: Drag-and-drop image upload with validation
- **Color Customization**: Background, foreground, and label color pickers
- **Barcode Configuration**: Format selection and message input
- **Validation**: Real-time validation with error display

### 3. Pass Generation
- **Apple Wallet Compliance**: Full adherence to Apple's pass format specification
- **PKCS#7 Signing**: Detached signature generation with certificate chain
- **Manifest Generation**: SHA-1 hash validation for all files
- **Image Processing**: Sharp-based image validation and processing
- **ZIP Packaging**: Proper .pkpass file structure

### 4. API Endpoints
- **POST /api/uploads**: Multipart image upload with SHA-256 deduplication
- **GET /api/templates**: List all available templates
- **GET /api/templates/:id**: Get specific template details
- **POST /api/passes/validate**: Validate pass data before generation
- **POST /api/passes**: Create and generate .pkpass file
- **GET /api/passes/:id/download**: Download generated .pkpass file
- **GET /api/passes/:id**: Get pass information and metadata

### 5. Database Schema
- **Template Storage**: Template definitions and metadata
- **Asset Management**: Image assets with SHA-256 deduplication
- **Pass Records**: Generated pass metadata and associations
- **Audit Trail**: Creation timestamps and update tracking

### 6. CLI Tool
- **Sample Generation**: Create sample passes from templates
- **Local Testing**: Development mode with dummy certificates
- **Validation**: .pkpass file structure validation
- **Batch Processing**: Generate multiple passes from configuration

## Phase 2 Features - Apple Wallet Web Service

### 7. PassKit Web Service
- **Device Registration**: Register devices to receive push notifications
- **Pass Updates**: Dynamic pass updates with version tracking
- **Push Notifications**: APNs integration for real-time updates
- **Pass Download**: Serve updated .pkpass files to devices
- **Device Logging**: Receive and process device logs

### 8. APNs Integration
- **Token Authentication**: JWT-based APNs authentication (recommended)
- **Certificate Authentication**: P12 certificate fallback support
- **Mock Mode**: Development mode without real APNs credentials
- **Retry Logic**: Exponential backoff for failed deliveries
- **Rate Limiting**: Respect APNs rate limits and implement client-side limiting

### 9. Update Workflow
- **Tag System**: Monotonically increasing update tags
- **Outbox Pattern**: Reliable push notification delivery
- **Background Worker**: Process push notifications asynchronously
- **Business Updates**: Internal API for triggering pass updates
- **Device Polling**: Support for Apple's pass update polling

### 10. Security & Rate Limiting
- **Token Authentication**: Secure pass access with generated tokens
- **Rate Limiting**: Prevent abuse with configurable limits
- **Input Validation**: Zod-based request validation
- **Error Handling**: Structured error responses
- **Audit Logging**: Track all authentication and update events

## Template Features

### Stamp Card Template
- **Variables**: brandName, stampCount, stampTarget, rewardText, barcodeMessage
- **Fields**: Primary (stamps), Secondary (brand), Auxiliary (reward)
- **Images**: icon (required), logo (optional), strip (optional)
- **Barcode**: QR code with custom message

### Coupon Template
- **Variables**: offerText, expiryDate, couponCode, brandName
- **Fields**: Primary (offer), Secondary (expiry), Auxiliary (code)
- **Images**: icon (required), logo (required), strip (optional)
- **Barcode**: QR code with coupon code

### Membership Template
- **Variables**: memberName, membershipTier, memberId, expiryDate, brandName
- **Fields**: Primary (member), Secondary (tier), Auxiliary (expiry)
- **Images**: icon (required), logo (required), strip (optional)
- **Barcode**: Code 128 with member ID

## Editor Features

### Variable Management
- **Type Support**: string, number, date, enum
- **Validation**: Required field validation, type checking
- **Live Preview**: Real-time expression evaluation
- **Error Display**: Clear error messages and suggestions

### Image Management
- **Upload Interface**: Drag-and-drop with file type validation
- **Dimension Validation**: Exact size requirements with warnings
- **Role Assignment**: Automatic role detection from upload context
- **Preview**: Thumbnail preview with dimension display

### Color Customization
- **Color Picker**: Visual color selection with hex input
- **Template Defaults**: Pre-configured color schemes
- **Live Preview**: Real-time color application
- **Accessibility**: High contrast validation

### Barcode Configuration
- **Format Selection**: QR, Code 128, PDF417, Aztec
- **Message Input**: Custom barcode content
- **Encoding Options**: UTF-8, ISO-8859-1
- **Alt Text**: Accessibility support

## Validation Features

### Pass Data Validation
- **Required Variables**: Check all required template variables
- **Image Requirements**: Validate required images are present
- **Barcode Validation**: Ensure barcode message is provided
- **Type Checking**: Validate variable types match template definitions

### Image Validation
- **Format Validation**: PNG only, proper MIME type
- **Dimension Validation**: Exact size requirements per Apple spec
- **File Size**: Reasonable file size limits
- **Content Validation**: Valid image data, not corrupted

### .pkpass Validation
- **ZIP Structure**: Valid ZIP archive with proper file layout
- **Required Files**: pass.json, manifest.json, signature, icon files
- **Manifest Validation**: SHA-1 hash verification
- **Signature Validation**: PKCS#7 signature verification

## Development Features

### CLI Commands
- **make-sample**: Generate sample passes from templates
- **validate**: Validate .pkpass file structure
- **Development Mode**: Dummy certificates for testing
- **Batch Processing**: Generate multiple passes from config

### Development Tools
- **TypeScript**: Full type safety across all packages
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Hot Reload**: Fast development iteration

### Testing Support
- **Sample Data**: Pre-configured sample variables
- **Dummy Certificates**: Development mode signing
- **Validation Tools**: Comprehensive validation utilities
- **Debug Output**: Detailed error messages and logging

## Performance Features

### Asset Optimization
- **SHA-256 Deduplication**: Prevent duplicate image storage
- **Image Processing**: Sharp-based optimization
- **Caching**: Template and asset caching
- **CDN Ready**: Prepared for CDN integration

### Database Optimization
- **Indexed Queries**: Optimized database queries
- **Connection Pooling**: Efficient database connections
- **Migrations**: Structured database evolution
- **Backup Support**: Database backup and restore

## Security Features

### Certificate Management
- **Environment Variables**: No hardcoded secrets
- **Certificate Validation**: Proper certificate chain validation
- **Signing Security**: Secure PKCS#7 signature generation
- **Key Protection**: Private key security best practices

### Input Validation
- **File Type Validation**: Strict file type checking
- **Size Limits**: Reasonable file size restrictions
- **Content Validation**: Malicious content detection
- **SQL Injection**: Parameterized queries

### Error Handling
- **Graceful Degradation**: Proper error handling
- **Logging**: Comprehensive error logging
- **User Feedback**: Clear error messages
- **Debug Information**: Detailed error context
