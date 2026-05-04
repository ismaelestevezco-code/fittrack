import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WorkoutStackNavigator } from '@/navigation/WorkoutStackNavigator';
import { BodyStackNavigator } from '@/navigation/BodyStackNavigator';
import { PlanningStackNavigator } from '@/navigation/PlanningStackNavigator';
import { ProfileStackNavigator } from '@/navigation/ProfileStackNavigator';
import { useTheme } from '@/context/ThemeContext';
import { Layout, Typography } from '@/constants/theme';
import type { MainTabParamList } from '@/types/navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { active: TabIconName; inactive: TabIconName }> = {
  Workout: { active: 'dumbbell', inactive: 'dumbbell' },
  Body: { active: 'scale-bathroom', inactive: 'scale-bathroom' },
  Planning: { active: 'calendar-week', inactive: 'calendar-week-outline' },
  Profile: { active: 'account', inactive: 'account-outline' },
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Workout: 'Entreno',
  Body: 'Cuerpo',
  Planning: 'Planning',
  Profile: 'Perfil',
};

export function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <MaterialCommunityIcons
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={color}
            />
          );
        },
        tabBarLabel: TAB_LABELS[route.name],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textHint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Layout.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.medium,
        },
      })}
    >
      <Tab.Screen name="Workout" component={WorkoutStackNavigator} />
      <Tab.Screen name="Body" component={BodyStackNavigator} />
      <Tab.Screen name="Planning" component={PlanningStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
