// Generated from ReadiNes Design System 1.0 (Light/Dark tokens).
// Screens must consume these roles only; never write literal colours.

export const lightColors = {
  surface: {
    canvas: '#F6F7FA',
    default: '#FFFFFF',
    secondary: '#EEEFF5',
    raised: '#FFFFFF',
    inset: '#F3F4F8',
    disabled: '#EEEFF5',
    inverse: '#17141F',
    hover: 'rgba(23, 20, 31, 0.05)',
    brandTint: '#F1ECF8',
  },
  text: {
    heading: '#1B1626',
    primary: '#2A2435',
    secondary: '#5D5869',
    tertiary: '#736D7F',
    disabled: '#857F92',
    inverse: '#FFFFFF',
    interactive: '#5E3A99',
    link: '#5E3A99',
    destructive: '#A8232B',
    onBrand: '#FFFFFF',
  },
  icon: {
    primary: '#2A2435',
    secondary: '#736D7F',
    disabled: '#B9B4C2',
    inverse: '#FFFFFF',
    interactive: '#5E3A99',
    link: '#5E3A99',
  },
  border: {
    subtle: '#E6E7EE',
    default: '#D8D9E3',
    emphasis: '#B3B0BE',
    hover: '#8E899B',
    disabled: '#E6E7EE',
    interactive: '#5E3A99',
    destructive: {
      default: '#F0A0A5',
      hover: '#D9434C',
    },
  },
  action: {
    primary: {
      default: '#5E3A99',
      hover: '#6F4BAE',
      pressed: '#4C2D80',
      disabled: '#EFEBF6',
    },
    secondary: {
      default: '#FFFFFF',
      hover: '#F3F4F8',
      pressed: '#E6E7EE',
      disabled: '#EEEFF5',
    },
    tertiary: {
      default: 'rgba(255, 255, 255, 0.00)',
      hover: 'rgba(23, 20, 31, 0.05)',
      pressed: 'rgba(23, 20, 31, 0.10)',
      disabled: 'rgba(255, 255, 255, 0.00)',
    },
    destructive: {
      default: '#C62F38',
      hover: '#D9434C',
      pressed: '#A8232B',
      disabled: '#EDB8BC',
    },
    neutral: {
      default: '#8E899B',
      hover: '#7E7889',
      pressed: '#5D5869',
      disabled: '#D8D9E3',
    },
  },
  status: {
    success: {
      surface: '#E3F4EA',
      border: '#5FBF83',
      text: '#176A3A',
      icon: '#1F8A4C',
    },
    warning: {
      surface: '#FBF1DC',
      border: '#D9A33B',
      text: '#6B4A05',
      icon: '#9A6B00',
    },
    danger: {
      surface: '#FCECEC',
      border: '#F0A0A5',
      text: '#A8232B',
      icon: '#C62F38',
    },
    info: {
      surface: '#E8F0FC',
      border: '#7FA8EC',
      text: '#1E4FA3',
      icon: '#2F6FDB',
    },
  },
  focus: {
    ring: {
      default: 'rgba(94, 58, 153, 0.40)',
      inverse: '#FFFFFF',
    },
  },
  selection: {
    surface: 'rgba(94, 58, 153, 0.10)',
    border: '#6F4BAE',
    text: '#4C2D80',
    icon: '#5E3A99',
  },
  overlay: {
    backdrop: 'rgba(23, 20, 31, 0.40)',
    scrim: 'rgba(23, 20, 31, 0.40)',
    highlight: 'rgba(23, 20, 31, 0.05)',
  },
  logo: {
    default: '#1B1626',
  },
  shadow: {
    strong: 'rgba(23, 20, 31, 0.18)',
    soft: 'rgba(23, 20, 31, 0.08)',
  },
  person: {
    1: '#2F6FDB',
    2: '#5E3A99',
    3: '#0F7F7A',
    4: '#B8386F',
    5: '#9A6B00',
  },
} as const;

export const darkColors = {
  surface: {
    canvas: '#121216',
    default: '#1A1A20',
    secondary: '#232329',
    raised: '#222228',
    inset: '#16161B',
    disabled: '#232329',
    inverse: '#F6F7FA',
    hover: 'rgba(255, 255, 255, 0.06)',
    brandTint: '#2A2537',
  },
  text: {
    heading: '#F4F4F6',
    primary: '#E8E8EC',
    secondary: '#B3B3BC',
    tertiary: '#8E8E98',
    disabled: '#88888F',
    inverse: '#17141F',
    interactive: '#B79BE6',
    link: '#B79BE6',
    destructive: '#F28B92',
    onBrand: '#17141F',
  },
  icon: {
    primary: '#E8E8EC',
    secondary: '#8E8E98',
    disabled: '#625C70',
    inverse: '#17141F',
    interactive: '#B79BE6',
    link: '#B79BE6',
  },
  border: {
    subtle: '#2A2A31',
    default: '#35353E',
    emphasis: '#4C4C56',
    hover: '#6A6A74',
    disabled: '#2A2536',
    interactive: '#B79BE6',
    destructive: {
      default: '#8A3A40',
      hover: '#F28B92',
    },
  },
  action: {
    primary: {
      default: '#A784DE',
      hover: '#B79BE6',
      pressed: '#9470CC',
      disabled: '#2B2B32',
    },
    secondary: {
      default: '#1A1A20',
      hover: '#232329',
      pressed: '#2C2C33',
      disabled: '#1E1E24',
    },
    tertiary: {
      default: 'rgba(255, 255, 255, 0.00)',
      hover: 'rgba(255, 255, 255, 0.06)',
      pressed: 'rgba(255, 255, 255, 0.12)',
      disabled: 'rgba(255, 255, 255, 0.00)',
    },
    destructive: {
      default: '#E25560',
      hover: '#F28B92',
      pressed: '#C62F38',
      disabled: '#4A2A2E',
    },
    neutral: {
      default: '#6B6579',
      hover: '#8F8A9D',
      pressed: '#B5B0C2',
      disabled: '#352F44',
    },
  },
  status: {
    success: {
      surface: '#17301F',
      border: '#2E7D4E',
      text: '#8FD9AA',
      icon: '#5FBF83',
    },
    warning: {
      surface: '#332A12',
      border: '#8A6A1E',
      text: '#F0C86A',
      icon: '#D9A33B',
    },
    danger: {
      surface: '#3A1A1D',
      border: '#8A3A40',
      text: '#F5A3A8',
      icon: '#F28B92',
    },
    info: {
      surface: '#172238',
      border: '#2F5398',
      text: '#9DBEF5',
      icon: '#7FA8EC',
    },
  },
  focus: {
    ring: {
      default: 'rgba(183, 155, 230, 0.45)',
      inverse: '#17141F',
    },
  },
  selection: {
    surface: 'rgba(183, 155, 230, 0.14)',
    border: '#A784DE',
    text: '#D4C2F0',
    icon: '#B79BE6',
  },
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.50)',
    scrim: 'rgba(0, 0, 0, 0.50)',
    highlight: 'rgba(255, 255, 255, 0.06)',
  },
  logo: {
    default: '#F5F3F9',
  },
  shadow: {
    strong: 'rgba(0, 0, 0, 0.55)',
    soft: 'rgba(0, 0, 0, 0.35)',
  },
  person: {
    1: '#7FA8EC',
    2: '#B79BE6',
    3: '#5FC4BE',
    4: '#F08CB4',
    5: '#E0B45A',
  },
} as const;

type Widen<T> = { -readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type ThemeColors = Widen<typeof lightColors>;

// Theme-independent values for static StyleSheet blocks.
export const staticColors = {
  white: '#FFFFFF',
} as const;
