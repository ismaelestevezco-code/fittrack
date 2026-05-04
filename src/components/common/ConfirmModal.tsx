import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} onClose={onCancel}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      <View style={styles.actions}>
        <Button label={cancelLabel} onPress={onCancel} variant="ghost" style={styles.btn} />
        <Button
          label={confirmLabel}
          onPress={onConfirm}
          variant={destructive ? 'destructive' : 'primary'}
          style={styles.btn}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing[6],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  btn: {
    flex: 1,
  },
});
