import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  dark: {
    // GEMINI "SURFACE" GRAY (Neutral Matte)
    
    // Background: Not black, but a deep matte charcoal (#131314)
    background: 'hsl(240 2% 9%)', 
    
    // Text: Soft white, not harsh (#E3E3E3)
    foreground: 'hsl(0 0% 89%)', 
    
    // Card: The main "Surface" color (#1E1F20) - Distinct from BG but subtle
    card: 'hsl(240 2% 13%)', 
    cardForeground: 'hsl(0 0% 98%)',
    
    // Popover: Matches card surface
    popover: 'hsl(240 2% 13%)',
    popoverForeground: 'hsl(0 0% 98%)',
    
    // Primary: High contrast soft white (for main buttons) or Gemini Blue if you prefer
    // Gemini often uses white buttons on dark mode for high visibility
    primary: 'hsl(0 0% 98%)', 
    primaryForeground: 'hsl(240 2% 9%)', // Black text on white button
    
    // Secondary: Used for inputs/pills (#28292A) - Lighter than card
    secondary: 'hsl(240 2% 18%)', 
    secondaryForeground: 'hsl(0 0% 98%)',
    
    // Muted: For disabled items or subtitles
    muted: 'hsl(240 2% 18%)',
    mutedForeground: 'hsl(240 2% 60%)', // Medium grey text
    
    // Accent: Used for hover states (#303132)
    accent: 'hsl(240 2% 22%)',
    accentForeground: 'hsl(0 0% 98%)',
    
    destructive: 'hsl(0 62.8% 30.6%)',
    
    // Border: Subtle separation, barely visible
    border: 'hsl(240 2% 20%)',
    input: 'hsl(240 2% 20%)',
    
    // Ring: Focus states (Gemini Blueish)
    ring: 'hsl(212 90% 60%)',
    radius: '0.75rem',
    
    // Charts: Pastel/Neon accents typical of AI interfaces
    chart1: 'hsl(220 70% 50%)',
    chart2: 'hsl(160 60% 45%)',
    chart3: 'hsl(30 80% 55%)',
    chart4: 'hsl(280 65% 60%)',
    chart5: 'hsl(340 75% 55%)',
  },
};


// ... Your NAV_THEME remains exactly the same, it will inherit these values
export const NAV_THEME: Record<'dark', Theme> = {
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
