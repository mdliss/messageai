/**
 * TypingIndicator component
 * displays typing status with animated dots
 * shows user names who are currently typing
 */

import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface TypingIndicatorProps {
  typingUserNames: string[];
}

export default function TypingIndicator({ typingUserNames }: TypingIndicatorProps) {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log('[TypingIndicator] timestamp:', new Date().toISOString(), '- setting up animation');

    // create bouncing dot animation with initial delay
    const animateDot = (dot: Animated.Value, initialDelay: number) => {
      // set initial delay before starting the loop
      Animated.sequence([
        Animated.delay(initialDelay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: -8,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    // start animations with staggered initial delays for wave effect
    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);

    // cleanup
    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  // always render container to prevent layout jumping, but hide content if no one is typing
  const isTyping = typingUserNames.length > 0;

  // format typing message based on number of users
  const getTypingMessage = (): string => {
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing`;
    } else {
      return `${typingUserNames[0]} and ${typingUserNames.length - 1} others are typing`;
    }
  };

  // animated dot vertical translation for bounce effect
  const getDotStyle = (dot: Animated.Value) => ({
    transform: [
      {
        translateY: dot,
      },
    ],
  });

  return (
    <View style={[styles.container, !isTyping && styles.containerHidden]}>
      {isTyping && (
        <>
          <Text style={styles.text}>{getTypingMessage()}</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
            <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
            <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 32,
    backgroundColor: '#F8F8F8',
  },
  containerHidden: {
    minHeight: 0,
    paddingVertical: 0,
  },
  text: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginRight: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginHorizontal: 2,
  },
});

