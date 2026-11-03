module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native(-community)?|react-redux|@reduxjs/toolkit|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|styled-components|lucide-react-native|react-native-svg|immer|redux|redux-thunk|reselect)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^lucide-react-native$': '<rootDir>/__mocks__/lucide-react-native.js',
  },
};
