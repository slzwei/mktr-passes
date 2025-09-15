import { z } from 'zod';

// Expression types for template variables
export type Expr = string | { var: string } | { concat: Expr[] } | { format: string; args: Expr[] };

// Template field definitions
export type TemplateField = {
  slot: 'primary' | 'secondary' | 'auxiliary' | 'back';
  key: string;
  label?: string;
  valueExpr: Expr;
};

// Barcode specification
export type BarcodeSpec = {
  format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatCode128' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec';
  messageExpr: Expr;
  messageEncoding?: 'iso-8859-1' | 'utf-8';
  altTextExpr?: Expr;
};

// Image specification
export type ImageSpec = {
  role: 'icon' | 'logo' | 'strip' | 'background' | 'thumbnail';
  required: boolean;
  recommendedSize: { w: number; h: number };
};

// Template definition
export type Template = {
  id: string;
  name: string;
  style: 'generic'; // For M1 we stick to generic
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
    options?: string[]; // For enum type
  }>;
};

// Pass instance data
export type PassData = {
  templateId: string;
  variables: Record<string, any>;
  colors?: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  };
  barcode?: {
    format: string;
    message: string;
    messageEncoding?: string;
    altText?: string;
  };
  images: Record<string, string>; // role -> assetId
};

// Asset information
export type AssetInfo = {
  id: string;
  role: string;
  originalName: string;
  width: number;
  height: number;
  sha256: string;
  path: string;
  createdAt: Date;
};

// Validation result
export type ValidationResult = {
  ok: boolean;
  errors: ValidationError[];
};

export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

// Apple Wallet pass.json structure
export type ApplePassJson = {
  formatVersion: 1;
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  serialNumber: string;
  description: string;
  backgroundColor?: string;
  foregroundColor?: string;
  labelColor?: string;
  generic: {
    primaryFields?: Array<{
      key: string;
      label?: string;
      value: string;
    }>;
    secondaryFields?: Array<{
      key: string;
      label?: string;
      value: string;
    }>;
    auxiliaryFields?: Array<{
      key: string;
      label?: string;
      value: string;
    }>;
    backFields?: Array<{
      key: string;
      label?: string;
      value: string;
    }>;
  };
  barcode?: {
    format: string;
    message: string;
    messageEncoding?: string;
    altText?: string;
  };
};

// Zod schemas for validation
export const TemplateFieldSchema = z.object({
  slot: z.enum(['primary', 'secondary', 'auxiliary', 'back']),
  key: z.string(),
  label: z.string().optional(),
  valueExpr: z.any(), // Expression type is complex, validate at runtime
});

export const BarcodeSpecSchema = z.object({
  format: z.enum(['PKBarcodeFormatQR', 'PKBarcodeFormatCode128', 'PKBarcodeFormatPDF417', 'PKBarcodeFormatAztec']),
  messageExpr: z.any(),
  messageEncoding: z.enum(['iso-8859-1', 'utf-8']).optional(),
  altTextExpr: z.any().optional(),
});

export const ImageSpecSchema = z.object({
  role: z.enum(['icon', 'logo', 'strip', 'background', 'thumbnail']),
  required: z.boolean(),
  recommendedSize: z.object({
    w: z.number(),
    h: z.number(),
  }),
});

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  style: z.literal('generic'),
  images: z.array(ImageSpecSchema),
  fields: z.array(TemplateFieldSchema),
  barcode: BarcodeSpecSchema.optional(),
  defaultColors: z.object({
    backgroundColor: z.string().optional(),
    foregroundColor: z.string().optional(),
    labelColor: z.string().optional(),
  }).optional(),
  variables: z.record(z.object({
    type: z.enum(['string', 'number', 'date', 'enum']),
    description: z.string(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })),
});

export const PassDataSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.any()),
  colors: z.object({
    backgroundColor: z.string().optional(),
    foregroundColor: z.string().optional(),
    labelColor: z.string().optional(),
  }).optional(),
  barcode: z.object({
    format: z.string(),
    message: z.string(),
    messageEncoding: z.string().optional(),
    altText: z.string().optional(),
  }).optional(),
  images: z.record(z.string()),
});

export const ApplePassJsonSchema = z.object({
  formatVersion: z.literal(1),
  passTypeIdentifier: z.string(),
  teamIdentifier: z.string(),
  organizationName: z.string(),
  serialNumber: z.string(),
  description: z.string(),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  labelColor: z.string().optional(),
  generic: z.object({
    primaryFields: z.array(z.object({
      key: z.string(),
      label: z.string().optional(),
      value: z.string(),
    })).optional(),
    secondaryFields: z.array(z.object({
      key: z.string(),
      label: z.string().optional(),
      value: z.string(),
    })).optional(),
    auxiliaryFields: z.array(z.object({
      key: z.string(),
      label: z.string().optional(),
      value: z.string(),
    })).optional(),
    backFields: z.array(z.object({
      key: z.string(),
      label: z.string().optional(),
      value: z.string(),
    })).optional(),
  }),
  barcode: z.object({
    format: z.string(),
    message: z.string(),
    messageEncoding: z.string().optional(),
    altText: z.string().optional(),
  }).optional(),
});
