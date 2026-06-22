import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { typography } from '../tokens/typography';
import { useThemeColors } from '@/theme/useThemeColors';

export type TextVariant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  children?: React.ReactNode;
}

const getFontFamily = (family: string, weight: string) => {
  if (family === 'Inter') {
    switch (weight) {
      case '400':
        return 'Inter_400Regular';
      case '500':
        return 'Inter_500Medium';
      case '600':
        return 'Inter_600SemiBold';
      case '700':
        return 'Inter_700Bold';
      case '800':
        return 'Inter_800ExtraBold';
      default:
        return 'Inter_400Regular';
    }
  }
  return family;
};

export function Text({ variant = 'body', color, style, accessibilityRole, ...props }: TextProps) {
  const colors = useThemeColors();
  const typoStyle = typography[variant];

  const isHeading =
    variant === 'h1' ||
    variant === 'h2' ||
    variant === 'h3';
  const role = accessibilityRole ?? (isHeading ? 'header' : undefined);

  // Map to the specific expo-google-fonts name and remove fontWeight to prevent 
  // RN from trying to synthesize bold/italic and falling back to system font.
  const resolvedFontFamily = getFontFamily(
    typoStyle.fontFamily,
    typoStyle.fontWeight
  );

  return (
    <RNText
      accessibilityRole={role}
      style={[
        {
          fontFamily: resolvedFontFamily,
          fontSize: typoStyle.fontSize,
          lineHeight: typoStyle.lineHeight,
          letterSpacing: typoStyle.letterSpacing,
          color: color || colors.text,
        },
        style,
      ]}
      {...props}
    />
  );
}
