import { lightColorTokens, darkColorTokens } from './colorTokens';
// Styled native components parse CSS declarations. Keep object-valued native
// shadowOffset out of these inputs; boxShadow expands it correctly. Elevation
// is a unitless string so the CSS parser does not append "px".
const makeShadows = (colors: Record<string, string>) => ({
  none: {},
  card: {
    boxShadow: `0px 4px 12px ${colors['shadow-soft']}`,
    elevation: '2',
  },
  floating: {
    boxShadow: `0px 8px 18px ${colors['shadow-strong']}`,
    elevation: '5',
  },
} satisfies Record<'none' | 'card' | 'floating', { boxShadow?: string; elevation?: string }>);

export const shadows = makeShadows(lightColorTokens);
export const darkShadows = makeShadows(darkColorTokens);
