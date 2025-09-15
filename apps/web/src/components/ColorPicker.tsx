import { useState } from 'react';

interface ColorPickerProps {
  value?: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  };
  onChange: (colors: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  }) => void;
  defaultColors?: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  };
}

export function ColorPicker({ value, onChange, defaultColors }: ColorPickerProps) {
  const [colors, setColors] = useState({
    backgroundColor: value?.backgroundColor || defaultColors?.backgroundColor || 'rgb(60,65,80)',
    foregroundColor: value?.foregroundColor || defaultColors?.foregroundColor || 'rgb(255,255,255)',
    labelColor: value?.labelColor || defaultColors?.labelColor || 'rgb(255,255,255)',
  });

  const handleColorChange = (key: keyof typeof colors, newColor: string) => {
    const newColors = { ...colors, [key]: newColor };
    setColors(newColors);
    onChange(newColors);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Background Color</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={colors.backgroundColor}
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
            className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={colors.backgroundColor}
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
            className="input flex-1"
            placeholder="rgb(60,65,80)"
          />
        </div>
      </div>

      <div>
        <label className="label">Foreground Color</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={colors.foregroundColor}
            onChange={(e) => handleColorChange('foregroundColor', e.target.value)}
            className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={colors.foregroundColor}
            onChange={(e) => handleColorChange('foregroundColor', e.target.value)}
            className="input flex-1"
            placeholder="rgb(255,255,255)"
          />
        </div>
      </div>

      <div>
        <label className="label">Label Color</label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={colors.labelColor}
            onChange={(e) => handleColorChange('labelColor', e.target.value)}
            className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={colors.labelColor}
            onChange={(e) => handleColorChange('labelColor', e.target.value)}
            className="input flex-1"
            placeholder="rgb(255,255,255)"
          />
        </div>
      </div>
    </div>
  );
}
