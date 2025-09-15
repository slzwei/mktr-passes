import { Template, PassData } from '../services/api';
import { evaluateExpression } from '@wallet-platform/core';

interface PassPreviewProps {
  template: Template;
  data: PassData;
}

export function PassPreview({ template, data }: PassPreviewProps) {
  // Evaluate expressions for each field
  const evaluatedFields: Record<string, any> = {};
  
  template.fields.forEach((field: any) => {
    try {
      evaluatedFields[field.key] = evaluateExpression(field.valueExpr, data.variables || {});
    } catch (error) {
      evaluatedFields[field.key] = `Error: ${error}`;
    }
  });

  const colors = {
    backgroundColor: data.colors?.backgroundColor || template.defaultColors?.backgroundColor || 'rgb(60,65,80)',
    foregroundColor: data.colors?.foregroundColor || template.defaultColors?.foregroundColor || 'rgb(255,255,255)',
    labelColor: data.colors?.labelColor || template.defaultColors?.labelColor || 'rgb(255,255,255)',
  };

  return (
    <div className="max-w-sm mx-auto">
      {/* Apple Wallet Pass Preview */}
      <div
        className="relative rounded-2xl shadow-lg overflow-hidden"
        style={{
          backgroundColor: colors.backgroundColor,
          color: colors.foregroundColor,
          width: '320px',
          height: '200px',
        }}
      >
        {/* Header with icon */}
        <div className="flex items-center p-4 border-b border-white/20">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
            <span className="text-xs font-bold">W</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: colors.labelColor }}>
              {template.name}
            </div>
            <div className="text-xs opacity-80">
              Apple Wallet
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Primary field */}
          {template.fields
            .filter((field: any) => field.slot === 'primary')
            .map((field: any) => (
              <div key={field.key}>
                <div className="text-xs opacity-80" style={{ color: colors.labelColor }}>
                  {field.label || field.key}
                </div>
                <div className="text-lg font-semibold">
                  {evaluatedFields[field.key] || `{${field.key}}`}
                </div>
              </div>
            ))}

          {/* Secondary field */}
          {template.fields
            .filter((field: any) => field.slot === 'secondary')
            .map((field: any) => (
              <div key={field.key}>
                <div className="text-xs opacity-80" style={{ color: colors.labelColor }}>
                  {field.label || field.key}
                </div>
                <div className="text-sm">
                  {evaluatedFields[field.key] || `{${field.key}}`}
                </div>
              </div>
            ))}

          {/* Auxiliary field */}
          {template.fields
            .filter((field: any) => field.slot === 'auxiliary')
            .map((field: any) => (
              <div key={field.key}>
                <div className="text-xs opacity-80" style={{ color: colors.labelColor }}>
                  {field.label || field.key}
                </div>
                <div className="text-sm">
                  {evaluatedFields[field.key] || `{${field.key}}`}
                </div>
              </div>
            ))}
        </div>

        {/* Barcode area */}
        {template.hasBarcode && data.barcode && (
          <div className="absolute bottom-4 right-4">
            <div className="w-16 h-16 bg-white/20 rounded flex items-center justify-center">
              <div className="text-xs">QR</div>
            </div>
          </div>
        )}
      </div>

      {/* Debug info */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <div className="font-medium mb-2">Debug Info:</div>
        <div>Template: {template.id}</div>
        <div>Variables: {Object.keys(data.variables || {}).length}</div>
        <div>Images: {Object.keys(data.images || {}).length}</div>
        {data.barcode && <div>Barcode: {data.barcode.format}</div>}
      </div>
    </div>
  );
}
