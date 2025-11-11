# Component Refactoring Plan

## Overview

Plan to split large component files (1000+ lines) into smaller, manageable, and reusable components.

## Target Files

### 1. `qr-generator.tsx` (1753 lines) 🚨
**Current State**: Monolithic component with everything in one file
**Target**: Split into 8-10 smaller components (~200 lines each)

### 2. `dashboard/page.tsx` (638 lines) ⚠️
**Current State**: Large page component with embedded components
**Target**: Extract sub-components

## Refactoring Strategy

### Phase 1: Extract Preview Components ✅ (DONE)

**Created Files**:
- ✅ `src/components/qr/template-preview.tsx` (96 lines)
- ✅ `src/components/qr/shape-icons.tsx` (51 lines)

**Next Steps**:
- [ ] Create `src/components/qr/shape-preview.tsx`
- [ ] Create `src/components/qr/sticker-preview.tsx`

### Phase 2: Extract Form Sections

**Files to Create**:

```
src/components/qr/
├── basic-qr-form.tsx         # URL, title, basic settings
├── color-picker-section.tsx  # Color customization
├── style-options-section.tsx # Dot type, corner type
├── logo-upload-section.tsx   # Logo upload and preview
├── advanced-options.tsx      # Templates, shapes, stickers
├── dynamic-qr-section.tsx    # Dynamic QR settings
└── qr-preview-card.tsx       # QR code preview display
```

### Phase 3: Extract Main Component Logic

**Main Component**: `qr-generator.tsx` (~300 lines)
- State management
- Form submission
- Orchestration of sub-components

## Detailed Breakdown

### `basic-qr-form.tsx` (~150 lines)

**Responsibility**: Basic QR code information
- URL/Text input
- Title input
- Description textarea
- Form validation

```typescript
interface BasicQRFormProps {
  url: string
  setUrl: (url: string) => void
  title: string
  setTitle: (title: string) => void
  description?: string
  setDescription?: (desc: string) => void
}

export function BasicQRForm({ url, setUrl, title, setTitle }: BasicQRFormProps) {
  return (
    <div className="space-y-4">
      {/* URL input */}
      {/* Title input */}
      {/* Description input */}
    </div>
  )
}
```

### `color-picker-section.tsx` (~100 lines)

**Responsibility**: Color customization
- Foreground color picker
- Background color picker
- Color presets
- Gradient options

```typescript
interface ColorPickerProps {
  foregroundColor: string
  setForegroundColor: (color: string) => void
  backgroundColor: string
  setBackgroundColor: (color: string) => void
}

export function ColorPickerSection({ ... }: ColorPickerProps) {
  return (
    <div className="space-y-4">
      {/* Color pickers */}
    </div>
  )
}
```

### `style-options-section.tsx` (~120 lines)

**Responsibility**: QR code styling
- Dot type selector
- Corner type selector
- Eye pattern selector

```typescript
interface StyleOptionsProps {
  dotType: string
  setDotType: (type: string) => void
  cornerType: string
  setCornerType: (type: string) => void
  eyePattern?: string
  setEyePattern?: (pattern: string) => void
}

export function StyleOptionsSection({ ... }: StyleOptionsProps) {
  return (
    <Tabs defaultValue="dots">
      {/* Dot types */}
      {/* Corner types */}
      {/* Eye patterns */}
    </Tabs>
  )
}
```

### `logo-upload-section.tsx` (~150 lines)

**Responsibility**: Logo upload and management
- File upload
- Image preview
- Remove logo
- File validation

```typescript
interface LogoUploadProps {
  logo: File | null
  setLogo: (file: File | null) => void
  logoPreview: string | null
  setLogoPreview: (url: string | null) => void
}

export function LogoUploadSection({ ... }: LogoUploadProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file upload
  }
  
  return (
    <div>
      {/* Upload button */}
      {/* Preview */}
      {/* Remove button */}
    </div>
  )
}
```

### `advanced-options.tsx` (~200 lines)

**Responsibility**: Advanced QR customization
- Template selection
- Shape selection
- Sticker selection
- Effects

```typescript
interface AdvancedOptionsProps {
  selectedTemplate: string | null
  onTemplateSelect: (id: string) => void
  selectedShape: QRShape
  onShapeSelect: (shape: QRShape) => void
  selectedSticker: string | null
  onStickerSelect: (id: string) => void
}

export function AdvancedOptions({ ... }: AdvancedOptionsProps) {
  return (
    <Tabs defaultValue="templates">
      <TabsList>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="shapes">Shapes</TabsTrigger>
        <TabsTrigger value="stickers">Stickers</TabsTrigger>
      </TabsList>
      
      {/* Template grid */}
      {/* Shape grid */}
      {/* Sticker grid */}
    </Tabs>
  )
}
```

### `dynamic-qr-section.tsx` (~150 lines)

**Responsibility**: Dynamic QR code settings
- Enable/disable dynamic
- Expiration date
- Max scans
- Redirect URL
- Dynamic content

```typescript
interface DynamicQRProps {
  isDynamic: boolean
  setIsDynamic: (value: boolean) => void
  expiresAt: string
  setExpiresAt: (date: string) => void
  maxScans: number
  setMaxScans: (scans: number) => void
  redirectUrl: string
  setRedirectUrl: (url: string) => void
}

export function DynamicQRSection({ ... }: DynamicQRProps) {
  return (
    <div className="space-y-4">
      {/* Dynamic toggle */}
      {isDynamic && (
        <>
          {/* Expiration date */}
          {/* Max scans */}
          {/* Redirect URL */}
        </>
      )}
    </div>
  )
}
```

### `qr-preview-card.tsx` (~200 lines)

**Responsibility**: QR code preview and download
- Live QR code preview
- Download buttons (PNG, SVG)
- Watermark toggle
- Preview updates

```typescript
interface QRPreviewCardProps {
  url: string
  foregroundColor: string
  backgroundColor: string
  dotType: string
  cornerType: string
  logo: File | null
  hasWatermark: boolean
  setHasWatermark: (value: boolean) => void
}

export function QRPreviewCard({ ... }: QRPreviewCardProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  
  // Generate QR code
  useEffect(() => {
    // QR generation logic
  }, [url, foregroundColor, backgroundColor, ...])
  
  const handleDownload = (format: 'png' | 'svg') => {
    // Download logic
  }
  
  return (
    <Card>
      {/* Preview */}
      {/* Download buttons */}
      {/* Watermark toggle */}
    </Card>
  )
}
```

### Main `qr-generator.tsx` (~300 lines)

**After Refactoring**: Clean orchestration component

```typescript
export default function QRGenerator({ userId }: QRGeneratorProps) {
  // State management (all state variables)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  // ... other state
  
  // Handlers
  const handleSubmit = async () => {
    // Submit logic
  }
  
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Configuration */}
      <div className="space-y-6">
        <BasicQRForm
          url={url}
          setUrl={setUrl}
          title={title}
          setTitle={setTitle}
        />
        
        <ColorPickerSection
          foregroundColor={foregroundColor}
          setForegroundColor={setForegroundColor}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
        />
        
        <StyleOptionsSection
          dotType={dotType}
          setDotType={setDotType}
          cornerType={cornerType}
          setCornerType={setCornerType}
        />
        
        <LogoUploadSection
          logo={logo}
          setLogo={setLogo}
          logoPreview={logoPreview}
          setLogoPreview={setLogoPreview}
        />
        
        <AdvancedOptions
          selectedTemplate={selectedTemplate}
          onTemplateSelect={setSelectedTemplate}
          selectedShape={selectedShape}
          onShapeSelect={setSelectedShape}
        />
        
        <DynamicQRSection
          isDynamic={isDynamic}
          setIsDynamic={setIsDynamic}
          expiresAt={expiresAt}
          setExpiresAt={setExpiresAt}
        />
        
        <Button onClick={handleSubmit} className="w-full">
          Generate QR Code
        </Button>
      </div>
      
      {/* Right: Preview */}
      <div className="lg:sticky lg:top-6">
        <QRPreviewCard
          url={url}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          dotType={dotType}
          cornerType={cornerType}
          logo={logo}
          hasWatermark={hasWatermark}
          setHasWatermark={setHasWatermark}
        />
      </div>
    </div>
  )
}
```

## Dashboard Refactoring

### `dashboard/page.tsx` (638 lines)

**Current Structure**:
- QRCodePreview component (embedded)
- Main DashboardPage component
- Multiple inline components

**Files to Create**:

```
src/components/dashboard/
├── qr-code-preview.tsx      # QR code preview card
├── dashboard-stats.tsx      # Statistics cards
├── qr-code-list.tsx        # QR code list with actions
├── qr-code-actions.tsx     # Action buttons (delete, analytics)
└── analytics-dialog.tsx     # Analytics modal
```

### Example: `dashboard-stats.tsx`

```typescript
interface DashboardStatsProps {
  totalCodes: number
  totalDownloads: number
  thisMonth: number
  userCredits: number | null
  userPlan: string | null
}

export function DashboardStats({ ... }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
          <QrCode className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCodes}</div>
        </CardContent>
      </Card>
      
      {/* Other stat cards */}
    </div>
  )
}
```

## Benefits of Refactoring

### Code Quality ✅
- Smaller, focused components (~100-200 lines each)
- Single Responsibility Principle
- Easier to understand and maintain

### Performance ✅
- Components can be individually memoized (React.memo)
- Smaller re-render scope
- Better code splitting

### Reusability ✅
- Components can be used elsewhere
- Easier to test in isolation
- Shared logic extracted

### Developer Experience ✅
- Easier to navigate codebase
- Clear file structure
- Faster to find and fix bugs

## Implementation Checklist

### Phase 1: Extract Utilities ✅
- [x] Create `shape-icons.tsx`
- [x] Create `template-preview.tsx`
- [ ] Create `shape-preview.tsx`
- [ ] Create `sticker-preview.tsx`

### Phase 2: Extract Form Sections
- [ ] Create `basic-qr-form.tsx`
- [ ] Create `color-picker-section.tsx`
- [ ] Create `style-options-section.tsx`
- [ ] Create `logo-upload-section.tsx`
- [ ] Create `advanced-options.tsx`
- [ ] Create `dynamic-qr-section.tsx`

### Phase 3: Extract Preview
- [ ] Create `qr-preview-card.tsx`

### Phase 4: Refactor Main Component
- [ ] Update `qr-generator.tsx` to use sub-components
- [ ] Remove inline component definitions
- [ ] Add proper prop types
- [ ] Add React.memo where appropriate

### Phase 5: Dashboard Refactoring
- [ ] Create `dashboard-stats.tsx`
- [ ] Create `qr-code-preview.tsx`
- [ ] Create `qr-code-list.tsx`
- [ ] Create `qr-code-actions.tsx`
- [ ] Create `analytics-dialog.tsx`
- [ ] Update `dashboard/page.tsx`

### Phase 6: Testing & Validation
- [ ] Test all components individually
- [ ] Test integration
- [ ] Verify no regressions
- [ ] Update documentation

## File Structure After Refactoring

```
src/components/
├── qr/
│   ├── template-preview.tsx ✅
│   ├── shape-preview.tsx
│   ├── sticker-preview.tsx
│   ├── shape-icons.tsx ✅
│   ├── basic-qr-form.tsx
│   ├── color-picker-section.tsx
│   ├── style-options-section.tsx
│   ├── logo-upload-section.tsx
│   ├── advanced-options.tsx
│   ├── dynamic-qr-section.tsx
│   └── qr-preview-card.tsx
├── dashboard/
│   ├── dashboard-stats.tsx
│   ├── qr-code-preview.tsx
│   ├── qr-code-list.tsx
│   ├── qr-code-actions.tsx
│   └── analytics-dialog.tsx
└── qr-generator.tsx (refactored, ~300 lines)
```

## Estimated Impact

### Before
- `qr-generator.tsx`: 1753 lines
- `dashboard/page.tsx`: 638 lines
- **Total**: 2391 lines in 2 files

### After
- 10+ smaller components: ~150 lines each
- Main components: ~300 lines each
- **Total**: 2391 lines in 17+ files

### Benefits
- 📦 **Better Code Splitting**: Smaller bundle sizes
- ⚡ **Faster Rendering**: Memoized components
- 🧪 **Easier Testing**: Test components in isolation
- 🛠️ **Better DX**: Easier to find and fix bugs
- 🎯 **Better Performance**: Reduced re-renders

## Migration Strategy

1. ✅ Create new component files incrementally
2. Test each component in isolation
3. Update imports in main component
4. Remove old code after verification
5. Add React.memo where beneficial
6. Update tests and documentation

## Related Files

- Main generator: `src/components/qr-generator.tsx`
- Dashboard: `src/app/dashboard/page.tsx`
- Types: `src/types/qr-code-advanced.ts`
- Documentation: This file

---

**Status**: 🚧 In Progress (25% complete)
**Priority**: ⚠️ HIGH
**Impact**: High (better maintainability, performance)
**Complexity**: High (large refactoring)
**Time Estimate**: 4-6 hours for full completion

