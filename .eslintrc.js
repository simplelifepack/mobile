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
          {
            selector: "Property[key.name='fontWeight'][value.type='Literal']",
            message: 'Use fontWeights tokens, not weight literals.',
          },
          {
            selector:
              "Property[key.name=/^(padding|margin|gap|rowGap|columnGap)([A-Z][a-z]+)?$/][value.type='Literal'][value.raw=/^(1|3|5|7|9|10|11|13|14|15|17|18|19|21|22|23|25|26|27|28|29|30|31)$/]",
            message: 'Spacing must use the 0/2/4/6/8/12/16/20/24/32/40/48 scale.',
          },
          {
            selector:
              "JSXAttribute[name.name='size'][value.expression.type='Literal'][value.expression.value<28]",
            message: 'Use sizes.icon tokens for icon sizes.',
          },
        ],
      },
    },
  ],
};
