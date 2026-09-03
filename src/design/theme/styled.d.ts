import 'styled-components/native';
import type { AppTheme } from './types';
declare module 'styled-components/native' {
  export interface DefaultTheme extends AppTheme {}
}
