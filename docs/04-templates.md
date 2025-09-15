# Templates

## Template DSL

The template system uses a Domain Specific Language (DSL) to define how pass data maps to Apple Wallet pass.json fields.

### Expression Types

```typescript
type Expr = 
  | string                    // Literal string
  | { var: string }          // Variable reference
  | { concat: Expr[] }       // String concatenation
  | { format: string; args: Expr[] }; // String formatting
```

### Field Definitions

```typescript
type TemplateField = {
  slot: 'primary' | 'secondary' | 'auxiliary' | 'back';
  key: string;
  label?: string;
  valueExpr: Expr;
};
```

### Barcode Specification

```typescript
type BarcodeSpec = {
  format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatCode128' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec';
  messageExpr: Expr;
  messageEncoding?: 'iso-8859-1' | 'utf-8';
  altTextExpr?: Expr;
};
```

### Image Specification

```typescript
type ImageSpec = {
  role: 'icon' | 'logo' | 'strip' | 'background' | 'thumbnail';
  required: boolean;
  recommendedSize: { w: number; h: number };
};
```

### Template Definition

```typescript
type Template = {
  id: string;
  name: string;
  style: 'generic';
  images: ImageSpec[];
  fields: TemplateField[];
  barcode?: BarcodeSpec;
  defaultColors?: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  };
  variables: Record<string, {
    type: 'string' | 'number' | 'date' | 'enum';
    description: string;
    required: boolean;
    options?: string[];
  }>;
};
```

## Built-in Templates

### 1. Stamp Card Template (`stamp_card_v1`)

**Purpose**: Loyalty stamp card for tracking customer visits and rewards

**Variables**:
- `brandName` (string, required): Name of the business or brand
- `stampCount` (number, required): Current number of stamps earned
- `stampTarget` (number, required): Total number of stamps needed for reward
- `rewardText` (string, required): Description of the reward earned
- `barcodeMessage` (string, optional): Message encoded in the barcode
- `barcodeAltText` (string, optional): Alternative text for the barcode

**Fields**:
- **Primary**: "X of N stamps" (e.g., "3 of 8")
- **Secondary**: Brand name
- **Auxiliary**: Reward description

**Images**:
- `icon` (required): 29×29 pixels
- `logo` (optional): 160×50 pixels
- `strip` (optional): 320×84 pixels

**Barcode**: QR code with custom message

**Default Colors**:
- Background: `rgb(60,65,80)`
- Foreground: `rgb(255,255,255)`
- Label: `rgb(255,255,255)`

### 2. Coupon Template (`coupon_v1`)

**Purpose**: Discount coupon with expiry and redemption code

**Variables**:
- `offerText` (string, required): Description of the coupon offer
- `expiryDate` (date, required): Expiration date of the coupon
- `couponCode` (string, required): Coupon code for redemption
- `brandName` (string, required): Name of the business or brand

**Fields**:
- **Primary**: Offer description
- **Secondary**: Expiry date (formatted as "Expires YYYY-MM-DD")
- **Auxiliary**: Coupon code

**Images**:
- `icon` (required): 29×29 pixels
- `logo` (required): 160×50 pixels
- `strip` (optional): 320×84 pixels

**Barcode**: QR code with coupon code

**Default Colors**:
- Background: `rgb(255,255,255)`
- Foreground: `rgb(0,0,0)`
- Label: `rgb(100,100,100)`

### 3. Membership Template (`membership_v1`)

**Purpose**: Membership card with tier and member identification

**Variables**:
- `memberName` (string, required): Name of the member
- `membershipTier` (enum, required): Membership tier level
  - Options: Bronze, Silver, Gold, Platinum
- `memberId` (string, required): Unique member identification number
- `expiryDate` (date, required): Membership expiration date
- `brandName` (string, required): Name of the business or brand

**Fields**:
- **Primary**: Member name
- **Secondary**: Membership tier
- **Auxiliary**: Expiry date (formatted as "Expires YYYY-MM-DD")

**Images**:
- `icon` (required): 29×29 pixels
- `logo` (required): 160×50 pixels
- `strip` (optional): 320×84 pixels

**Barcode**: Code 128 with member ID

**Default Colors**:
- Background: `rgb(30,30,30)`
- Foreground: `rgb(255,255,255)`
- Label: `rgb(200,200,200)`

## Expression Evaluation

### Variable References

```typescript
{ var: 'brandName' }  // References the brandName variable
```

### String Concatenation

```typescript
{ concat: [
  { var: 'stampCount' },
  ' of ',
  { var: 'stampTarget' }
]}  // Results in "3 of 8"
```

### String Formatting

```typescript
{ format: 'Expires {0}', args: [{ var: 'expiryDate' }] }
// Results in "Expires 2024-12-31"
```

### Complex Expressions

```typescript
{ concat: [
  { var: 'memberName' },
  ' - ',
  { var: 'membershipTier' },
  ' Member'
]}  // Results in "John Doe - Gold Member"
```

## Image Requirements

### Apple Wallet Image Specifications

| Role | Size (@1x) | Size (@2x) | Required | Purpose |
|------|------------|------------|----------|---------|
| icon | 29×29 | 58×58 | Yes | Small icon displayed in pass list |
| logo | 160×50 | 320×100 | No | Logo displayed on pass |
| strip | 320×84 | 640×168 | No | Wide image displayed on pass |
| background | 180×220 | 360×440 | No | Background image for pass |
| thumbnail | 90×90 | 180×180 | No | Thumbnail for pass details |

### Image Validation Rules

1. **Format**: PNG only
2. **Dimensions**: Exact size match required
3. **Quality**: High quality, no compression artifacts
4. **Content**: Appropriate for pass context
5. **Size**: Reasonable file size (< 1MB)

## Color Customization

### Color Properties

- `backgroundColor`: Main background color
- `foregroundColor`: Text color
- `labelColor`: Label text color

### Color Format

Colors are specified in CSS format:
- `rgb(60,65,80)`
- `rgba(60,65,80,1)`
- `#3c4150`

### Accessibility

- Ensure sufficient contrast between text and background
- Test with colorblind users
- Provide high contrast alternatives

## Barcode Configuration

### Supported Formats

- **PKBarcodeFormatQR**: QR code (recommended)
- **PKBarcodeFormatCode128**: Code 128 (for member IDs)
- **PKBarcodeFormatPDF417**: PDF417 (for large data)
- **PKBarcodeFormatAztec**: Aztec (for small data)

### Encoding

- **UTF-8**: Default encoding for international characters
- **ISO-8859-1**: Legacy encoding for basic ASCII

### Best Practices

- Keep messages short and simple
- Use QR codes for URLs and complex data
- Use Code 128 for numeric IDs
- Test barcode scanning on real devices

## Template Development

### Creating New Templates

1. Define template structure in `packages/core/src/templates.ts`
2. Add template to `TEMPLATES` array
3. Test with sample data
4. Update documentation

### Template Validation

- All required variables must be defined
- Image specifications must match Apple requirements
- Expression syntax must be valid
- Default colors should be accessible

### Testing Templates

```bash
# Generate sample pass
pnpm cli make-sample --template your_template_v1 --dev

# Validate generated pass
pnpm cli validate --file ./dist/sample-your_template_v1.pkpass
```

## Customization

### Adding New Variables

```typescript
variables: {
  customField: {
    type: 'string',
    description: 'Custom field description',
    required: true,
  }
}
```

### Adding New Fields

```typescript
fields: [
  {
    slot: 'primary',
    key: 'customField',
    label: 'Custom Field',
    valueExpr: { var: 'customField' }
  }
]
```

### Adding New Images

```typescript
images: [
  {
    role: 'customImage',
    required: false,
    recommendedSize: { w: 100, h: 100 }
  }
]
```

## Best Practices

### Template Design

- Keep templates simple and focused
- Use clear, descriptive variable names
- Provide helpful descriptions
- Test with real data

### Expression Writing

- Use simple expressions when possible
- Avoid complex nested structures
- Test expressions with sample data
- Handle missing variables gracefully

### Image Selection

- Use high-quality images
- Ensure proper dimensions
- Test on different devices
- Consider accessibility

### Color Selection

- Use brand colors when appropriate
- Ensure good contrast
- Test in different lighting
- Provide alternatives
