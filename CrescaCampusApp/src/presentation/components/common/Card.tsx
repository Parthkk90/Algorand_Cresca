/**
 * Card Component
 * Reusable card container
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  default: {
    backgroundColor: theme.colors.card,
  },
  elevated: {
    backgroundColor: theme.colors.card,
    ...theme.shadows.md,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
