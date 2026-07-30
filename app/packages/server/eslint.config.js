import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
   globalIgnores(['node_modules', 'dist', 'generated']),
   {
      files: ['**/*.ts'],
      extends: [js.configs.recommended, tseslint.configs.recommended],
      languageOptions: {
         globals: globals.node,
      },
      rules: {
         '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_' },
         ],
         '@typescript-eslint/no-explicit-any': 'warn',
      },
   },
]);
