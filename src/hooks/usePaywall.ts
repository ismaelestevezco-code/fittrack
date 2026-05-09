import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation.types';

// Abre el paywall desde cualquier pantalla.
// Uso: const { openPaywall } = usePaywall();
//      openPaywall('pro');
export function usePaywall() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  function openPaywall(highlightTier?: 'plus' | 'pro') {
    navigation.navigate('Paywall', { highlightTier });
  }

  return { openPaywall };
}
