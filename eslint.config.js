import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';
export default ts.config(
 { ignores: ['node_modules/**','dist/**','android/**','ios/**','backend/**','test-results/**','playwright-report/**'] },
 js.configs.recommended, ...ts.configs.recommended,
 { languageOptions: { globals: {...globals.browser,...globals.node} },
   rules: { '@typescript-eslint/no-explicit-any':'off', '@typescript-eslint/no-unused-vars':'off',
    '@typescript-eslint/no-empty-function':'off', 'no-unused-vars':'off' } }
);
