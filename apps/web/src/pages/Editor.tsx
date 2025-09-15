import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiService, Template, PassData } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImageUpload } from '../components/ImageUpload';
import { PassPreview } from '../components/PassPreview';
import { ColorPicker } from '../components/ColorPicker';

const createPassSchema = z.object({
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

type PassFormData = z.infer<typeof createPassSchema>;

export function Editor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<PassFormData>({
    resolver: zodResolver(createPassSchema),
    defaultValues: {
      templateId: templateId || '',
      variables: {},
      images: {},
      colors: {},
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiService.getTemplate(id);
      setTemplate(response.template);
      
      // Initialize form with template defaults
      const defaultColors = response.template.defaultColors || {};
      setValue('colors', defaultColors);
    } catch (err: any) {
      setError(err.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, role: string) => {
    try {
      const asset = await apiService.uploadAsset(file, role);
      setValue(`images.${role}`, asset.id);
      setValidationErrors([]);
    } catch (err: any) {
      setValidationErrors([`Failed to upload ${role}: ${err.message}`]);
    }
  };

  const handleValidate = async () => {
    if (!templateId) return;
    
    try {
      const formData = watchedValues as PassData;
      formData.templateId = templateId;
      
      const result = await apiService.validatePass(formData);
      setValidationErrors(result.errors);
    } catch (err: any) {
      setValidationErrors([`Validation failed: ${err.message}`]);
    }
  };

  const handleGenerate = async (data: PassFormData) => {
    if (!templateId) return;
    
    try {
      setGenerating(true);
      setValidationErrors([]);
      
      const passData: PassData = {
        templateId: data.templateId,
        variables: data.variables,
        colors: data.colors,
        barcode: data.barcode,
        images: data.images,
      };
      
      const result = await apiService.createPass(passData);
      setDownloadUrl(result.downloadUrl);
    } catch (err: any) {
      setValidationErrors([`Generation failed: ${err.message}`]);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Template not found'}</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{template.name} Editor</h1>
        <p className="mt-2 text-gray-600">
          Create your Apple Wallet pass
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h3>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {downloadUrl && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">Pass Generated Successfully!</h3>
          <p className="text-sm text-green-700 mb-3">
            Your pass has been created and is ready to download.
          </p>
          <a
            href={downloadUrl}
            download
            className="btn btn-primary"
          >
            Download .pkpass
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                {template.variables.map((variable) => (
                  <div key={variable.key}>
                    <label className="label">
                      {variable.key}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {variable.type === 'enum' ? (
                      <select
                        {...register(`variables.${variable.key}`)}
                        className="input"
                      >
                        <option value="">Select {variable.key}</option>
                        {variable.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : variable.type === 'date' ? (
                      <input
                        type="date"
                        {...register(`variables.${variable.key}`)}
                        className="input"
                      />
                    ) : (
                      <input
                        type={variable.type === 'number' ? 'number' : 'text'}
                        {...register(`variables.${variable.key}`)}
                        className="input"
                        placeholder={variable.description}
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {variable.description}
                    </p>
                  </div>
                ))}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPicker
                value={watchedValues.colors}
                onChange={(colors) => setValue('colors', colors)}
                defaultColors={template.defaultColors}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.images.map((image) => (
                  <ImageUpload
                    key={image.role}
                    role={image.role}
                    required={image.required}
                    recommendedSize={image.recommendedSize}
                    onUpload={(file) => handleImageUpload(file, image.role)}
                    currentAssetId={watchedValues.images[image.role]}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {template.hasBarcode && (
            <Card>
              <CardHeader>
                <CardTitle>Barcode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="label">Message</label>
                    <input
                      {...register('barcode.message')}
                      className="input"
                      placeholder="Barcode message"
                    />
                  </div>
                  <div>
                    <label className="label">Format</label>
                    <select {...register('barcode.format')} className="input">
                      <option value="PKBarcodeFormatQR">QR Code</option>
                      <option value="PKBarcodeFormatCode128">Code 128</option>
                      <option value="PKBarcodeFormatPDF417">PDF417</option>
                      <option value="PKBarcodeFormatAztec">Aztec</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleValidate}
              variant="secondary"
              className="w-full"
            >
              Validate
            </Button>
            <Button
              onClick={handleSubmit(handleGenerate)}
              disabled={generating}
              className="w-full"
            >
              {generating ? 'Generating...' : 'Generate .pkpass'}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <PassPreview
                template={template}
                data={watchedValues}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
