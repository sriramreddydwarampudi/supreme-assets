import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StatusToggleProps {
  status: 'working' | 'not-working';
  onToggle: (status: 'working' | 'not-working') => void;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ status, onToggle }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, status === 'working' && styles.activeWorking]}
        onPress={() => onToggle('working')}
      >
        <Text style={[styles.text, status === 'working' && styles.activeText]}>
          ✓ Working
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, status === 'not-working' && styles.activeNotWorking]}
        onPress={() => onToggle('not-working')}
      >
        <Text style={[styles.text, status === 'not-working' && styles.activeText]}>
          ✗ Not Working
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeWorking: {
    backgroundColor: '#4CAF50',
  },
  activeNotWorking: {
    backgroundColor: '#F44336',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeText: {
    color: '#fff',
  },
});
