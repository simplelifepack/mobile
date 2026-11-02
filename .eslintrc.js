module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Design System 1.0 gate: screens compose tokens; they never define appearance.
      files: ['src/**/*.{ts,tsx}'],
      excludedFiles: ['src/design/tokens/**', '**/*.test.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
            message: 'Use a colour token from design/tokens/colors, not a hex literal.',
          },
          {
            selector: "Literal[value=/^rgba?\\(/]",
            message: 'Use a colour token from design/tokens/colors, not an rgb(a) literal.',
          },
          {
            selector:
              "Property[key.name=/^(fontSize|lineHeight|borderRadius)$/][value.type='Literal']",
            message: 'Use fontSize/lineHeight/radius tokens, not numeric literals.',
          },
        ],
      },
    },
  ],
};
