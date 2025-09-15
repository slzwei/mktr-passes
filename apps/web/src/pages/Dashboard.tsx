import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, Template } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTemplates();
      setTemplates(response.templates);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadTemplates}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pass Templates</h1>
        <p className="mt-2 text-gray-600">
          Choose a template to create your Apple Wallet pass
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>
                {template.style} pass template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Images</h4>
                  <div className="space-y-1">
                    {template.images
                      .filter(img => img.required)
                      .map((img) => (
                        <div key={img.role} className="text-sm text-gray-600">
                          {img.role} ({img.recommendedSize.w}×{img.recommendedSize.h})
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Variables</h4>
                  <div className="text-sm text-gray-600">
                    {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {template.hasBarcode && (
                  <div className="text-sm text-gray-600">
                    ✓ Barcode support
                  </div>
                )}

                <div className="pt-4">
                  <Link to={`/editor/${template.id}`}>
                    <Button className="w-full">
                      Create Pass
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
