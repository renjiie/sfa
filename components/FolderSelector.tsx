import * as FileSystem from 'expo-file-system';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import type { FileObject } from '../services/fileService';
import { scanFolderForFiles } from '../services/fileService';

interface FolderSelectorProps {
  onFolderScanned: (files: FileObject[], folderPath: string) => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({ onFolderScanned }) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  const selectAndScanFolder = async () => {
    try {
      let folderPath: string;

      if (Platform.OS === 'android') {
        folderPath = FileSystem.documentDirectory + 'Download/';
        Alert.alert(
          'Scan Folder',
          "We'll scan the Downloads folder for searchable files. Continue?",
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Scan', onPress: () => processFolderScan(folderPath) },
          ]
        );
      } else {
        if (!FileSystem.documentDirectory) {
          throw new Error('Document directory is not available.');
        }
        folderPath = FileSystem.documentDirectory;
        Alert.alert(
          'Scan Folder',
          "We'll scan the Documents folder for searchable files. Continue?",
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Scan', onPress: () => processFolderScan(folderPath) },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error selecting folder:', error);
      Alert.alert('Error', 'Failed to select folder: ' + (error?.message ?? String(error)));
    }
  };

  const processFolderScan = async (folderPath: string) => {
    setIsScanning(true);
    setFileCount(0);

    try {
      setSelectedFolder(folderPath);

      const files = await scanFolderForFiles(folderPath, (count: number) => {
        setFileCount(count);
      });

      if (files.length === 0) {
        Alert.alert('No Files Found', 'No supported files were found in the selected folder.');
      } else {
        onFolderScanned(files, folderPath);
        Alert.alert('Scan Complete', `Found ${files.length} files that can be indexed for search.`);
      }
    } catch (error: any) {
      console.error('Error scanning folder:', error);
      Alert.alert('Error', 'Failed to scan folder: ' + (error?.message ?? String(error)));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={selectAndScanFolder}
        disabled={isScanning}
      >
        <Text style={styles.buttonText}>
          {isScanning ? 'Scanning...' : 'Scan Folder for Files'}
        </Text>
        {isScanning && (
          <ActivityIndicator size="small" color="white" style={styles.loader} />
        )}
      </TouchableOpacity>

      {isScanning && (
        <Text style={styles.scanningText}>
          Scanning folder... Found {fileCount} files so far
        </Text>
      )}

      {selectedFolder && !isScanning && (
        <Text style={styles.folderText} numberOfLines={1} ellipsizeMode="middle">
          Selected: {selectedFolder}
        </Text>
      )}

      <Text style={styles.helpText}>
        Scan a folder to find and index all supported files (text, images, videos)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#7e57c2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    marginLeft: 8,
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  scanningText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  folderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});

export default FolderSelector;