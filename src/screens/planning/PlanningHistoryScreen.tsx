import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningWeekCard } from '@/components/planning/PlanningWeekCard';
import { EmptyState } from '@/components/common/EmptyState';
import { usePlanningStore } from '@/stores/planningStore';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';
import type { PlanningStackParamList } from '@/types/navigation.types';

type Props = NativeStackScreenProps<PlanningStackParamList, 'PlanningHistory'>;

export function PlanningHistoryScreen({ navigation: _navigation }: Props) {
  const { colors } = useTheme();
  const { history, isLoading, loadHistory } = usePlanningStore();

  useEffect(() => {
    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        {history.length === 0 ? (
          <EmptyState
            icon="clock-outline"
            title="Sin historial"
            description="Los plannings de semanas anteriores aparecerán aquí."
          />
        ) : (
          <>
            <Text style={[styles.hint, { color: colors.textHint }]}>
              Toca una semana para ver sus recomendaciones.
            </Text>
            {history.map(plan => (
              <PlanningWeekCard key={plan.id} plan={plan} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
    gap: Spacing[3],
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
  },
});
