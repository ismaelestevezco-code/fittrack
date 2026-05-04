import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#071428',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
});
