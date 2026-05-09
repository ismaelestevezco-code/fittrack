import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';

// Color de fondo que coincide con los bordes del vídeo
const BG = '#071428';
const BG0 = 'rgba(7,20,40,0)';

// Altura de las bandas: diferencia entre altura de pantalla y altura del vídeo a ancho completo
const { width: SW, height: SH } = Dimensions.get('screen');
const VIDEO_HEIGHT = SW * (16 / 9);
const BAR_SIZE = Math.max(0, Math.ceil((SH - VIDEO_HEIGHT) / 2));
// El degradado cubre la banda completa + 40px extra de fundido hacia el vídeo
const GRAD_HEIGHT = BAR_SIZE + 40;

interface SplashVideoProps {
  onReady?: () => void;
}

export function SplashVideo({ onReady }: SplashVideoProps) {
  const player = useVideoPlayer(
    require('../../../assets/splash-video.mp4'),
    p => {
      p.loop = true;
      p.muted = true;
      p.play();
    },
  );

  useEffect(() => {
    onReady?.();
  }, []);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* Tapa la banda superior y la funde con el vídeo */}
      <LinearGradient
        colors={[BG, BG, BG0]}
        locations={[0, BAR_SIZE / GRAD_HEIGHT, 1]}
        style={[styles.gradient, { height: GRAD_HEIGHT, top: 0 }]}
        pointerEvents="none"
      />

      {/* Tapa la banda inferior y la funde con el vídeo */}
      <LinearGradient
        colors={[BG0, BG, BG]}
        locations={[0, 1 - BAR_SIZE / GRAD_HEIGHT, 1]}
        style={[styles.gradient, { height: GRAD_HEIGHT, bottom: 0 }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
