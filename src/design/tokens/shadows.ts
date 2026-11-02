// Design System 1.0 elevation: raised = y1/blur2, overlay = y8/blur24. Shadow base is the ink colour.
const ink = '#17141F';

export const shadows = {
  none: {},
  card: {
    shadowColor: ink,
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  floating: {
    shadowColor: ink,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
