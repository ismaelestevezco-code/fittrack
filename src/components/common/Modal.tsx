import React from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing } from '@/constants/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Modal({ visible, onClose, children, contentStyle }: ModalProps) {
  const { colors } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.content,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
            contentStyle,
          ]}
          onPress={() => undefined}
        >
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  content: {
    borderRadius: Layout.cardRadius + 4,
    borderWidth: 0.5,
    padding: Spacing[6],
    width: '100%',
  },
});
