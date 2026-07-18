import { Colors } from '@/constants/Colors';
import { getMediaMetaParts } from '@/constants/labels';
import { Typography } from '@/constants/Typography';
import type { Media } from '@/services/types';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { TextSeparator } from './TextSeparator';

interface MediaMetaTextProps {
  media: Pick<Media, 'media_type' | 'place_count'>;
}

export function MediaMetaText({ media }: MediaMetaTextProps) {
  const parts = getMediaMetaParts(media);
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <TextSeparator />}
          <Text style={styles.text}>{part}</Text>
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  text: { ...Typography.subtitle1, color: Colors.light.grayDark },
});
