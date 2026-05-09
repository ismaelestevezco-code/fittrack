import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getWhitelistEntries,
  addToWhitelist,
  removeFromWhitelist,
} from '@/firebase/authService';
import { Spacing, Typography, Layout } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WhitelistEntry {
  email: string;
  addedAt: number;
}

export function WhitelistScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const loadEntries = useCallback(async () => {
    try {
      const data = await getWhitelistEntries();
      setEntries(data.sort((a, b) => b.addedAt - a.addedAt));
    } catch {
      setError('Error al cargar la whitelist.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleAdd() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Introduce un correo válido.');
      return;
    }

    if (entries.some(e => e.email === trimmed)) {
      setError('Este correo ya está en la whitelist.');
      return;
    }

    setError('');
    setIsAdding(true);
    try {
      await addToWhitelist(trimmed);
      setNewEmail('');
      await loadEntries();
    } catch {
      setError('Error al añadir el correo.');
    } finally {
      setIsAdding(false);
    }
  }

  function handleRemove(email: string) {
    Alert.alert(
      'Eliminar acceso',
      `¿Eliminar el acceso de ${email}?\nSi tiene una cuenta creada, no podrá volver a iniciar sesión.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromWhitelist(email);
              await loadEntries();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el correo.');
            }
          },
        },
      ],
    );
  }

  function formatDate(ts: number): string {
    if (!ts) return '';
    try {
      return format(new Date(ts * 1000), 'd MMM yyyy', { locale: es });
    } catch {
      return '';
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Gestión de acceso</Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Solo los correos de esta lista pueden crear cuenta y acceder a FitTrack.
      </Text>

      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          value={newEmail}
          onChangeText={text => { setNewEmail(text); setError(''); }}
          placeholder="correo@ejemplo.com"
          placeholderTextColor={colors.textHint}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }, isAdding && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Ionicons name="add" size={22} color={colors.background} />
          )}
        </Pressable>
      </View>

      {error !== '' && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: Spacing[8] }} color={colors.primary} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.textHint} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay correos en la whitelist.</Text>
          <Text style={[styles.emptySubtext, { color: colors.textHint }]}>Añade correos para dar acceso a usuarios.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.email}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.entryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.entryInfo}>
                <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                <View style={styles.entryText}>
                  <Text style={[styles.entryEmail, { color: colors.textPrimary }]}>{item.email}</Text>
                  {item.addedAt > 0 && (
                    <Text style={[styles.entryDate, { color: colors.textHint }]}>Añadido el {formatDate(item.addedAt)}</Text>
                  )}
                </View>
              </View>
              <Pressable onPress={() => handleRemove(item.email)} hitSlop={10} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[5],
    lineHeight: 20,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
  },
  addButton: {
    borderRadius: Layout.borderRadius.md,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing[3],
  },
  list: {
    paddingTop: Spacing[2],
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Layout.borderRadius.md,
    borderWidth: 0.5,
    padding: Spacing[4],
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  entryText: {
    flex: 1,
  },
  entryEmail: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  entryDate: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  removeButton: {
    padding: Spacing[1],
  },
  separator: {
    height: Spacing[2],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
