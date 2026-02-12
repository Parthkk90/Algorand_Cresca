/**
 * Loading Component
 * Full screen and inline loading indicators
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../../theme';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({
  fullScreen = false,
  text,
  size = 'large',
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={theme.colors.primary} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {text && <Text style={styles.inlineText}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    fontSize: 16,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  inlineText: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    fontSize: 14,
  },
});
