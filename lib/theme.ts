import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  dark: {
    // CLAUDE-INSPIRED "WARM SLATE" THEME
    
    // Background: A deep, warm charcoal (almost espresso). 
    // It feels organic, not void-like.
    background: 'hsl(30 6% 11%)', 
    
    // Text: A warm, creamy off-white. 
    // Easier on the eyes than pure white, feels like old paper.
    foreground: 'hsl(30 15% 94%)', 
    
    // Card: Slightly lighter warm grey. 
    // Think: Smooth river stone. Distinct, but blends softly.
    card: 'hsl(30 4% 16%)', 
    cardForeground: 'hsl(30 15% 94%)',
    
    // Popover: Matches card surface
    popover: 'hsl(30 4% 16%)',
    popoverForeground: 'hsl(30 15% 94%)',
    
    // Primary: "Clay" / "Terracotta".
    // This is the signature Claude accent. 
    // It is energetic but grounded. It implies "building" and "restoration."
    primary: 'hsl(27 85% 65%)', 
    primaryForeground: 'hsl(30 6% 10%)', // Dark text on clay button for contrast
    
    // Secondary: Muted warm brown/grey. Used for pills/inputs.
    secondary: 'hsl(30 4% 22%)', 
    secondaryForeground: 'hsl(30 15% 96%)',
    
    // Muted: Subtle separation.
    muted: 'hsl(30 4% 22%)',
    mutedForeground: 'hsl(30 5% 65%)', // Warm grey text
    
    // Accent: Used for hover/press states.
    accent: 'hsl(30 4% 28%)',
    accentForeground: 'hsl(30 15% 98%)',
    
    // Destructive: A muted brick red. 
    // Serious, but not shouting "ERROR" like a neon sign.
    destructive: 'hsl(0 70% 50%)',
    
    // Border: Very subtle warm line.
    border: 'hsl(30 4% 20%)',
    input: 'hsl(30 4% 20%)',
    
    // Ring: The focus ring matches the Primary Clay color.
    ring: 'hsl(27 85% 65%)',
    radius: '0.75rem', // Claude uses slightly softer, rounded corners
    
    // Charts: Earthy, distinct tones suitable for tracking progress (streaks).
    chart1: 'hsl(27 85% 65%)',  // The Clay (Primary)
    chart2: 'hsl(173 58% 39%)', // Muted Teal (Growth/Nature)
    chart3: 'hsl(43 74% 66%)',  // Sand/Gold (Divine/Light)
    chart4: 'hsl(12 76% 61%)',  // Burnt Sienna
    chart5: 'hsl(270 20% 60%)', // Muted Purple (Royal/Spiritual)
  },
};

// NAV_THEME inherits the new warm tones
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