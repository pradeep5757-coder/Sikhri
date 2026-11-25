import { createTheme } from '@mantine/core';

// Brand gold scale — index 6 is the primary brand gold (#BFA25A),
// 7 is the hover gold (#AD9150), 8 is the text gold (#8F7534).
const gold = ['#FAF7EE', '#F2EBD8', '#E6D8B3', '#D9C48C', '#CFB574', '#C6AA65', '#BFA25A', '#AD9150', '#8F7534', '#6F5A27'];

export const theme = createTheme({
  primaryColor: 'gold',
  primaryShade: 6,
  colors: { gold },
  fontFamily: 'Avenir Next, Avenir, Arial, sans-serif',
  headings: {
    fontFamily: 'Avenir Next, Avenir, Arial, sans-serif',
    fontWeight: '600',
    sizes: { h2: { fontSize: '20px', lineHeight: '1.25' }, h3: { fontSize: '16px', lineHeight: '1.3' } },
  },
  lineHeights: { md: '1.45' },
  defaultRadius: 'md',
  radius: { md: '8px' },
  black: '#212121',
  cursorType: 'pointer',
  focusRing: 'never', // focus outlines are drawn by donation.css to match the original exactly
});

export const cssVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-text': '#212121',
    '--mantine-color-body': '#ffffff',
    '--mantine-color-error': '#C1442E',
    '--mantine-color-dimmed': '#6B6B6B',
    '--mantine-color-placeholder': '#8E8E8E',
  },
  dark: {},
});
