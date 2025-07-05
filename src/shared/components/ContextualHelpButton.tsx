import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { HelpSystem } from './HelpSystem';

interface ContextualHelpButtonProps {
  screen: string;
  userType?: 'student' | 'educator' | 'admin';
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'floating';
  size?: 'small' | 'medium' | 'large';
  style?: any;
  contentId?: string;
  category?: string;
}

export const ContextualHelpButton: React.FC<ContextualHelpButtonProps> = ({
  screen,
  userType = 'student',
  position = 'top-right',
  size = 'medium',
  style,
  contentId,
  category,
}) => {
  const [helpVisible, setHelpVisible] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  React.useEffect(() => {
    // Pulse animation to draw attention
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    const pulseLoop = Animated.loop(pulse, { iterations: 3 });
    
    // Start pulsing after 2 seconds
    const timer = setTimeout(() => {
      pulseLoop.start();
    }, 2000);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, []);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 36,
          height: 36,
          borderRadius: 18,
        };
      case 'large':
        return {
          width: 56,
          height: 56,
          borderRadius: 28,
        };
      default: // medium
        return {
          width: 44,
          height: 44,
          borderRadius: 22,
        };
    }
  };

  const getPositionStyles = () => {
    const base = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top-right':
        return {
          ...base,
          top: 20,
          right: 20,
        };
      case 'bottom-right':
        return {
          ...base,
          bottom: 20,
          right: 20,
        };
      case 'bottom-left':
        return {
          ...base,
          bottom: 20,
          left: 20,
        };
      case 'floating':
        return {
          ...base,
          bottom: 80,
          right: 20,
        };
      default:
        return base;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <>
      <Animated.View
        style={[
          getPositionStyles(),
          { transform: [{ scale: pulseAnim }] },
          style,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.helpButton,
            getSizeStyles(),
          ]}
          onPress={() => setHelpVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.helpIcon, { fontSize: getIconSize() }]}>?</Text>
        </TouchableOpacity>
      </Animated.View>

      <HelpSystem
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        initialScreen={screen}
        userType={userType}
        initialCategory={category}
        initialContentId={contentId}
      />
    </>
  );
};

interface QuickHelpTooltipProps {
  text: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const QuickHelpTooltip: React.FC<QuickHelpTooltipProps> = ({
  text,
  visible,
  onClose,
  children,
}) => {
  return (
    <View style={styles.tooltipContainer}>
      {children}
      {visible && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{text}</Text>
          <TouchableOpacity style={styles.tooltipClose} onPress={onClose}>
            <Text style={styles.tooltipCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

interface HelpTextProps {
  children: React.ReactNode;
  helpText: string;
  style?: any;
}

export const HelpText: React.FC<HelpTextProps> = ({
  children,
  helpText,
  style,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.helpTextContainer, style]}
      onPress={() => setShowTooltip(!showTooltip)}
      activeOpacity={0.7}
    >
      <View style={styles.helpTextContent}>
        {children}
        <Text style={styles.helpTextIcon}>ⓘ</Text>
      </View>
      
      {showTooltip && (
        <View style={styles.helpTextTooltip}>
          <Text style={styles.helpTextTooltipText}>{helpText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  helpButton: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  helpIcon: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  tooltipContainer: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 8,
    zIndex: 1001,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  tooltipClose: {
    marginLeft: 8,
    padding: 4,
  },
  tooltipCloseText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  helpTextContainer: {
    position: 'relative',
  },
  helpTextContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpTextIcon: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
  },
  helpTextTooltip: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#333',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    zIndex: 1001,
  },
  helpTextTooltipText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
  },
});