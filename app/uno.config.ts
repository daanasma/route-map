// uno.config.ts
import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss';

export default defineConfig({
    presets: [
    presetUno(),
    presetAttributify(), // Allows for attribute-based classes
    presetIcons(),       // Optional: Add icon support
  ],
  rules: [
    // Add custom rules if needed
  ],
  shortcuts: {
    // Custom shortcuts (e.g., reusable utility classes)
    'btn': 'px-4 py-2 bg-blue-500 text-white rounded',
      'flex-center': 'flex justify-center items-center',    // Center content with flex
  },
  theme: {
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
      },
  },
});
