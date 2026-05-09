import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/common/Modal';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Spacing, Typography } from '@/constants/theme';
import {
  searchExercises,
  MUSCLE_GROUPS,
  type LibraryExercise,
} from '@/constants/exerciseLibrary';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: LibraryExercise) => void;
}

// Modal de búsqueda y selección de ejercicios de la biblioteca predefinida.
// Permite buscar por nombre y filtrar por grupo muscular.
export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
}: ExercisePickerModalProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>();

  const results = useMemo(
    () => searchExercises(query, selectedGroup),
    [query, selectedGroup],
  );

  const handleSelect = useCallback(
    (exercise: LibraryExercise) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(exercise);
      onClose();
      setQuery('');
      setSelectedGroup(undefined);
    },
    [onSelect, onClose],
  );

  return (
    <Modal visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Biblioteca de ejercicios
      </Text>

      <View
        style={[
          styles.searchRow,
          { backgroundColor: colors.surfaceHigh, borderColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textHint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={colors.textHint}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query !== '' && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={16} color={colors.textHint} />
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        data={['Todos', ...MUSCLE_GROUPS]}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupList}
        renderItem={({ item }) => {
          const isActive = item === 'Todos' ? !selectedGroup : selectedGroup === item;
          return (
            <Pressable
              style={[
                styles.groupChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.surfaceHigh,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedGroup(item === 'Todos' ? undefined : item);
              }}
            >
              <Text
                style={[
                  styles.groupChipText,
                  { color: isActive ? colors.background : colors.textSecondary },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={results}
        keyExtractor={item => item.name}
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.resultRow, { borderBottomColor: colors.border }]}
            onPress={() => handleSelect(item)}
          >
            <View style={styles.resultInfo}>
              <Text style={[styles.resultName, { color: colors.textPrimary }]}>
                {item.name}
              </Text>
              <Text style={[styles.resultMeta, { color: colors.textHint }]}>
                {item.muscleGroup} · {item.defaultSets}×{item.defaultReps}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textHint }]}>
            No se encontraron ejercicios
          </Text>
        }
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[3],
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    borderRadius: Layout.inputRadius,
    borderWidth: 0.5,
    paddingHorizontal: Spacing[3],
    height: Layout.inputHeight,
    marginBottom: Spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    height: '100%',
  },
  groupList: {
    gap: Spacing[2],
    paddingBottom: Spacing[3],
  },
  groupChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Layout.pillRadius,
    borderWidth: 0.5,
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.medium,
  },
  resultsList: {
    maxHeight: 280,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 0.5,
    gap: Spacing[3],
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  resultMeta: {
    fontSize: Typography.fontSize.xs,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    paddingVertical: Spacing[6],
  },
});
