import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/release/**',
      '**/coverage/**',
      '.superpowers/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'].map((c) => ({ ...c, files: ['apps/desktop/**/*.vue'] })),
  {
    // Scripts de Node (prueba de humo): corren en Node y mandan funciones a la página (`window`…).
    files: ['apps/desktop/scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
        window: 'readonly',
        document: 'readonly',
        location: 'readonly',
      },
    },
  },
  {
    files: ['apps/desktop/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser },
      globals: { window: 'readonly' },
    },
    rules: {
      // TypeScript (vue-tsc) ya verifica los nombres globales, incluidos los tipos del DOM.
      'no-undef': 'off',
      // Las vistas se nombran por su sección (Inicio, Sitios, Ajustes…).
      'vue/multi-word-component-names': 'off',
      // El formato del template lo decide Prettier; estas reglas chocan con él.
      'vue/max-attributes-per-line': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
    },
  },
);
