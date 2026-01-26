import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius } from '../theme/colors';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 40;

interface Tab {
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  label: string;
  key: string;
}

interface AnimatedTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export default function AnimatedTabBar({ tabs, activeTab, onTabPress }: AnimatedTabBarProps) {
  const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
  const translateX = useSharedValue(activeIndex * (TAB_BAR_WIDTH / tabs.length));

  useEffect(() => {
    const newIndex = tabs.findIndex((tab) => tab.key === activeTab);
    translateX.value = withSpring(newIndex * (TAB_BAR_WIDTH / tabs.length), {
      damping: 20,
      stiffness: 120,
      mass: 0.8,
    });
  }, [activeTab, tabs.length, translateX]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, indicatorStyle, { width: TAB_BAR_WIDTH / tabs.length - 16 }]} />
      {tabs.map((tab, index) => (
        <TabButton
          key={tab.key}
          icon={tab.icon}
          iconOutline={tab.iconOutline}
          label={tab.label}
          active={tab.key === activeTab}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onTabPress(tab.key);
          }}
        />
      ))}
    </View>
  );
}

interface TabButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabButton({ icon, iconOutline, label, active, onPress }: TabButtonProps) {
  const scale = useSharedValue(0.85);
  const iconScale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withTiming(active ? 1 : 0.85, { duration: 200 });
    iconScale.value = withSpring(active ? 1.15 : 1, {
      damping: 15,
      stiffness: 200,
    });
    opacity.value = withTiming(active ? 1 : 0.5, { duration: 200 });
  }, [active, scale, iconScale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name={active ? icon : iconOutline}
            size={26}
            color={active ? Colors.primary : Colors.text.secondary}
          />
        </Animated.View>
        <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    height: 50,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    top: 10,
    left: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text.secondary,
    marginTop: 4,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
