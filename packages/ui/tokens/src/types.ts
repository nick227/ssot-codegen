/**
 * Type definitions for SSOT tokens
 */

export interface TokenSet {
  version: string
  name: string
  description: string
  colors: ColorTokens
  spacing: SpacingTokens
  typography: TypographyTokens
  borderRadius: BorderRadiusTokens
  boxShadow: BoxShadowTokens
  zIndex: ZIndexTokens
  opacity: OpacityTokens
  breakpoints: BreakpointTokens
  transitions: TransitionTokens
}

export interface ColorTokens {
  primary: ColorScale
  secondary: ColorScale
  success: ColorScale
  warning: ColorScale
  error: ColorScale
  neutral: ColorScale
  background: ColorShades
  foreground: ColorShades
  border: ColorShades
  ring: ColorShades
}

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
  DEFAULT: string
  hover: string
  active?: string
  light?: string
  dark?: string
}

export interface ColorShades {
  DEFAULT: string
  muted?: string
  dark?: string
  light?: string
  hover?: string
  focus?: string
  error?: string
}

export interface SpacingTokens {
  0: number
  px: number
  [key: string]: number
}

export interface TypographyTokens {
  fontFamily: {
    sans: string[]
    mono: string[]
  }
  fontSize: {
    [key: string]: {
      size: number
      lineHeight: number
    }
  }
  fontWeight: {
    [key: string]: string
  }
  lineHeight: {
    [key: string]: number
  }
}

export interface BorderRadiusTokens {
  [key: string]: number | string
}

export interface BoxShadowTokens {
  [key: string]: string
}

export interface ZIndexTokens {
  [key: string]: number
}

export interface OpacityTokens {
  [key: string]: number
}

export interface BreakpointTokens {
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
  [key: string]: number
}

export interface TransitionTokens {
  [key: string]: string
}

/**
 * Tailwind config output
 */
export interface TailwindConfig {
  theme: {
    extend: {
      colors: Record<string, any>
      spacing: Record<string, string>
      fontSize: Record<string, [string, { lineHeight: string }]>
      fontWeight: Record<string, string>
      fontFamily: Record<string, string[]>
      borderRadius: Record<string, string>
      boxShadow: Record<string, string>
      zIndex: Record<string, string>
      opacity: Record<string, string>
      screens: Record<string, string>
      transitionDuration: Record<string, string>
    }
  }
}

/**
 * React Native tokens output
 */
export interface ReactNativeTokens {
  colors: Record<string, any>
  spacing: Record<string, number>
  typography: {
    fontSize: Record<string, number>
    fontWeight: Record<string, string>
    lineHeight: Record<string, number>
    fontFamily: Record<string, string>
  }
  borderRadius: Record<string, number>
  zIndex: Record<string, number>
  opacity: Record<string, number>
  breakpoints: Record<string, number>
  shadows: Record<string, any>
}

