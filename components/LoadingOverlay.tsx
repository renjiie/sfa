import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#4A55A2" />
          <Text style={styles.message}>{message || 'Loading...'}</Text>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.8,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  message: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingOverlay;