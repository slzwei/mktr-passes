# UX Editor Guide

## WYSIWYG Editor Overview

The WYSIWYG editor provides a user-friendly interface for creating Apple Wallet passes without technical knowledge. It features live preview, real-time validation, and intuitive controls.

## Editor Layout

### Three-Column Layout

```
┌─────────────────┬─────────────────┬─────────────────┐
│   Controls      │   Live Preview  │   Asset Manager │
│   (Left)        │   (Center)      │   (Right)       │
├─────────────────┼─────────────────┼─────────────────┤
│ • Variables     │                 │ • Image Upload  │
│ • Colors        │   Pass Preview  │ • Image Preview │
│ • Barcode       │                 │ • Validation    │
│ • Actions       │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

### Responsive Design

- **Desktop**: Full three-column layout
- **Tablet**: Collapsible sidebars
- **Mobile**: Single-column with tabs

## Controls Panel

### 1. Variables Section

**Purpose**: Edit template variables with real-time validation

**Features**:
- Dynamic form generation based on template
- Type-specific input controls
- Required field indicators
- Help text and descriptions
- Real-time validation feedback

**Input Types**:
- **Text**: Single-line text input
- **Number**: Numeric input with validation
- **Date**: Date picker with calendar
- **Enum**: Dropdown with predefined options

**Example**:
```
Variables
├── Brand Name * (text)
│   └── "Example Corp"
├── Stamp Count * (number)
│   └── 3
├── Stamp Target * (number)
│   └── 8
├── Reward Text * (text)
│   └── "Free coffee"
└── Barcode Message (text)
    └── "stamp-card-123"
```

### 2. Colors Section

**Purpose**: Customize pass appearance with color pickers

**Features**:
- Visual color picker
- Hex/RGB input fields
- Template default colors
- Live preview updates
- Accessibility validation

**Color Properties**:
- **Background**: Main pass background color
- **Foreground**: Text color
- **Label**: Label text color

**Example**:
```
Colors
├── Background Color
│   ├── [Color Picker] [rgb(60,65,80)]
│   └── Default: rgb(60,65,80)
├── Foreground Color
│   ├── [Color Picker] [rgb(255,255,255)]
│   └── Default: rgb(255,255,255)
└── Label Color
    ├── [Color Picker] [rgb(255,255,255)]
    └── Default: rgb(255,255,255)
```

### 3. Barcode Section

**Purpose**: Configure barcode settings (if template supports it)

**Features**:
- Format selection (QR, Code 128, etc.)
- Message input with validation
- Encoding options
- Alternative text for accessibility

**Example**:
```
Barcode
├── Format: [QR Code ▼]
├── Message: "stamp-card-123"
├── Encoding: [UTF-8 ▼]
└── Alt Text: "Stamp card 123"
```

### 4. Actions Section

**Purpose**: Validate and generate passes

**Buttons**:
- **Validate**: Check pass data for errors
- **Generate .pkpass**: Create and download pass

## Live Preview

### Pass Simulation

**Purpose**: Show how the pass will appear in Apple Wallet

**Features**:
- Real-time updates as you type
- Accurate color representation
- Field value evaluation
- Responsive sizing
- Error highlighting

**Preview Elements**:
- Pass background with colors
- Icon and logo placement
- Field values with labels
- Barcode representation
- Apple Wallet styling

### Preview States

1. **Loading**: Show spinner while processing
2. **Valid**: Green border, ready for generation
3. **Error**: Red border with error details
4. **Warning**: Yellow border with warnings

## Asset Manager

### Image Upload

**Purpose**: Upload and manage pass images

**Features**:
- Drag-and-drop interface
- File type validation (PNG only)
- Dimension validation
- Role assignment
- Preview thumbnails
- Progress indicators

**Upload States**:
1. **Empty**: Show upload area
2. **Uploading**: Show progress bar
3. **Success**: Show preview with checkmark
4. **Error**: Show error message with retry

### Image Requirements

**Display Requirements**:
- Show required vs optional images
- Display exact dimension requirements
- Show current image dimensions
- Highlight dimension mismatches

**Example**:
```
Images
├── Icon (Required) ✓
│   ├── 29×29 pixels (29×29) ✓
│   └── [Preview] [Remove]
├── Icon@2x (Required) ✓
│   ├── 58×58 pixels (58×58) ✓
│   └── [Preview] [Remove]
├── Logo (Optional)
│   ├── 160×50 pixels (160×50) ✓
│   └── [Preview] [Remove]
└── Strip (Optional)
    ├── 320×84 pixels (320×84) ✓
    └── [Preview] [Remove]
```

## Validation System

### Real-time Validation

**Purpose**: Provide immediate feedback on user input

**Validation Types**:
- **Required Fields**: Check all required variables
- **Image Requirements**: Validate required images
- **Dimension Validation**: Check image sizes
- **Format Validation**: Verify file types
- **Barcode Validation**: Ensure barcode message

### Error Display

**Error States**:
- **Field Errors**: Red border, error message below
- **Image Errors**: Red border, error message
- **General Errors**: Error banner at top
- **Warnings**: Yellow border, warning message

**Error Messages**:
- Clear, actionable language
- Specific field references
- Suggested fixes
- Help links when appropriate

### Validation Flow

1. **User Input**: User types or uploads
2. **Immediate Check**: Validate single field/image
3. **Display Feedback**: Show errors/warnings
4. **Full Validation**: Check all data on demand
5. **Generation Ready**: All validation passes

## User Experience Patterns

### Progressive Disclosure

**Principle**: Show complexity gradually

**Implementation**:
- Start with basic variables
- Show advanced options on demand
- Collapse sections when not needed
- Use tooltips for help

### Immediate Feedback

**Principle**: Provide instant response to user actions

**Implementation**:
- Live preview updates
- Real-time validation
- Progress indicators
- Success/error states

### Error Prevention

**Principle**: Prevent errors before they happen

**Implementation**:
- Input validation
- File type restrictions
- Dimension warnings
- Required field indicators

### Error Recovery

**Principle**: Help users fix errors easily

**Implementation**:
- Clear error messages
- Suggested fixes
- Undo/redo functionality
- Save drafts

## Accessibility

### Keyboard Navigation

**Features**:
- Tab order through all controls
- Enter to activate buttons
- Arrow keys for dropdowns
- Escape to close modals

### Screen Reader Support

**Features**:
- Proper ARIA labels
- Form field descriptions
- Error announcements
- Status updates

### Visual Accessibility

**Features**:
- High contrast mode
- Color-blind friendly colors
- Large text options
- Focus indicators

## Performance

### Optimization Strategies

**Image Processing**:
- Client-side validation
- Progressive loading
- Thumbnail generation
- Lazy loading

**Preview Updates**:
- Debounced updates
- Efficient re-rendering
- Minimal DOM changes
- Cached calculations

**Validation**:
- Async validation
- Cached results
- Batch operations
- Background processing

## Mobile Experience

### Touch Interactions

**Features**:
- Touch-friendly controls
- Swipe gestures
- Pinch to zoom
- Long press for context

### Responsive Layout

**Breakpoints**:
- **Mobile**: < 768px (single column)
- **Tablet**: 768px - 1024px (collapsible)
- **Desktop**: > 1024px (three columns)

### Mobile-Specific Features

**Features**:
- Camera integration for photos
- Touch-optimized file upload
- Simplified navigation
- Offline support

## Testing

### User Testing Scenarios

1. **First-time User**:
   - Can create a pass without help
   - Understands all controls
   - Successfully generates pass

2. **Power User**:
   - Can quickly create multiple passes
   - Uses advanced features
   - Handles complex data

3. **Error Recovery**:
   - Can fix validation errors
   - Understands error messages
   - Recovers from failures

### A/B Testing

**Test Variations**:
- Layout arrangements
- Color schemes
- Button text
- Help content
- Validation timing

### Analytics

**Track Metrics**:
- Completion rate
- Time to generate
- Error frequency
- Feature usage
- User satisfaction

## Future Enhancements

### Planned Features

1. **Template Customization**:
   - Custom field layouts
   - Advanced styling options
   - Custom templates

2. **Bulk Operations**:
   - Batch pass generation
   - CSV import/export
   - Template variables

3. **Advanced Preview**:
   - 3D pass preview
   - Animation preview
   - Device simulation

4. **Collaboration**:
   - Shared templates
   - Team editing
   - Version control

### User Feedback

**Collection Methods**:
- In-app feedback
- User surveys
- Usability testing
- Support tickets

**Improvement Process**:
1. Collect feedback
2. Analyze patterns
3. Prioritize changes
4. Implement updates
5. Measure impact
