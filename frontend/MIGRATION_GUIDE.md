# Migration Guide: LanguageContext → i18next

This guide helps you migrate from the custom `LanguageContext` to i18next.

## Why Migrate?

### Current System (LanguageContext)
- ✅ Simple and working
- ✅ All translations in one TypeScript file
- ❌ Translations bundled in JavaScript (increases bundle size)
- ❌ No lazy loading of translations
- ❌ Manual cache management for async translations
- ❌ Limited ecosystem support

### New System (i18next)
- ✅ Industry standard (used by thousands of companies)
- ✅ JSON files loaded on-demand (smaller initial bundle)
- ✅ Built-in caching and optimization
- ✅ Rich ecosystem (plugins, tools, integrations)
- ✅ Better TypeScript support with type-safe keys
- ✅ Namespace support for organizing translations
- ✅ Ready for future features (pluralization, interpolation, etc.)

## Side-by-Side Comparison

### Old Way (LanguageContext)

```typescript
import { useLanguage } from './contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => setLanguage('hi')}>Hindi</button>
    </div>
  );
}
```

### New Way (i18next)

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('hi')}>Hindi</button>
    </div>
  );
}
```

## Migration Steps

### Phase 1: Parallel Systems (Current State ✅)

Both systems work side-by-side. Your existing app uses `LanguageContext`, while the demo uses i18next.

**No breaking changes yet!**

### Phase 2: Migrate Components Gradually

Migrate components one at a time:

1. **Pick a component** (start with small ones)
2. **Replace the import:**
   ```diff
   - import { useLanguage } from '../contexts/LanguageContext';
   + import { useTranslation } from 'react-i18next';
   ```

3. **Update the hook usage:**
   ```diff
   - const { t, language, setLanguage } = useLanguage();
   + const { t, i18n } = useTranslation();
   ```

4. **Update language switching:**
   ```diff
   - setLanguage('hi')
   + i18n.changeLanguage('hi')
   ```

5. **Update language reading:**
   ```diff
   - {language === 'hi' && <div>...</div>}
   + {i18n.language === 'hi' && <div>...</div>}
   ```

6. **Test the component** to ensure translations work

### Phase 3: Migrate Translation Keys

Your existing translations are already copied to JSON files! But you may want to add more:

**Location of JSON files:**
- `public/locales/en/common.json`
- `public/locales/hi/common.json`
- `public/locales/mr/common.json`

**Adding new translations:**
1. Open the JSON file for each language
2. Add the key-value pair
3. Save the file
4. Refresh your browser (hot reload will pick it up)

### Phase 4: Organize with Namespaces (Optional)

As your app grows, organize translations by feature:

```
public/locales/
├── en/
│   ├── common.json       # Shared UI elements
│   ├── dashboard.json    # Dashboard-specific
│   ├── schemes.json      # Government schemes
│   └── crops.json        # Crop-related
├── hi/
│   ├── common.json
│   ├── dashboard.json
│   └── ...
└── mr/
    └── ...
```

**Using namespaces:**
```typescript
// Load specific namespace
const { t } = useTranslation('dashboard');

// Use translation from that namespace
<h1>{t('welcome')}</h1>  // Reads from dashboard.json

// Use multiple namespaces
const { t } = useTranslation(['common', 'dashboard']);
```

### Phase 5: Remove LanguageContext (Final Step)

Once all components are migrated:

1. **Remove the import from App.tsx:**
   ```diff
   - import { LanguageProvider } from './contexts/LanguageContext';
   ```

2. **Remove the provider wrapper:**
   ```diff
   - <LanguageProvider>
   -   <VoiceProvider>
   + <VoiceProvider>
   ```

3. **Delete the file:**
   ```bash
   rm src/contexts/LanguageContext.tsx
   ```

## Advanced Features

### 1. Interpolation (Variables in Translations)

**JSON:**
```json
{
  "greeting": "Hello, {{name}}!",
  "itemCount": "You have {{count}} items"
}
```

**Usage:**
```typescript
<p>{t('greeting', { name: 'Rajesh' })}</p>
// Output: "Hello, Rajesh!"

<p>{t('itemCount', { count: 5 })}</p>
// Output: "You have 5 items"
```

### 2. Pluralization

**JSON:**
```json
{
  "crop_one": "{{count}} crop",
  "crop_other": "{{count}} crops"
}
```

**Usage:**
```typescript
<p>{t('crop', { count: 1 })}</p>  // "1 crop"
<p>{t('crop', { count: 5 })}</p>  // "5 crops"
```

### 3. Nested Keys

**JSON:**
```json
{
  "dashboard": {
    "weather": {
      "temperature": "Temperature",
      "humidity": "Humidity"
    }
  }
}
```

**Usage:**
```typescript
<p>{t('dashboard.weather.temperature')}</p>
```

## Troubleshooting

### Translation not showing?

1. **Check the JSON file** - Is the key present?
2. **Check the browser console** - i18next logs missing keys
3. **Check the Network tab** - Did the JSON file load?
4. **Hard refresh** - Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Language not persisting?

Check localStorage in DevTools:
- Open DevTools → Application → Local Storage
- Look for `i18nextLng` key
- Should contain: `"en"`, `"hi"`, or `"mr"`

### TypeScript errors?

If you get type errors with `t()`, you can add type safety:

```typescript
// Create src/i18next.d.ts
import 'react-i18next';
import common from '../public/locales/en/common.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: {
      common: typeof common;
    };
  }
}
```

## Best Practices

1. **Keep keys lowercase with underscores:** `crop_diagnosis`, not `CropDiagnosis`
2. **Use namespaces for large apps:** Separate concerns (common, dashboard, etc.)
3. **Don't nest too deeply:** Max 2-3 levels (`dashboard.weather.temp` is fine)
4. **Use meaningful keys:** `welcome_message` not `msg1`
5. **Keep fallback language complete:** Always have all keys in English

## Need Help?

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Playground](https://www.i18next.com/overview/playground)

---

**Current Status:** ✅ i18next is installed and working alongside LanguageContext. You can migrate at your own pace!
