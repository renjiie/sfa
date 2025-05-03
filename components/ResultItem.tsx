import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { SearchResult } from '../services/searchService';
import { FileInfo, getFileInfo } from '../utils/fileUtils';

interface ResultItemProps {
  item: SearchResult;
}

const ResultItem: React.FC<ResultItemProps> = ({ item }) => {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadFileInfo = async () => {
      try {
        const info = await getFileInfo(item.path);
        if (isMounted) setFileInfo(info);
      } catch (error) {
        console.error('Error loading file info:', error);
      }
    };

    loadFileInfo();
    return () => {
      isMounted = false;
    };
  }, [item.path]);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  if (!fileInfo) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Render different content based on file type
  const renderContent = () => {
    if (!expanded) {
      return null;
    }

    switch (item.type) {
      case 'text':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.preview} numberOfLines={5}>
              {fileInfo.preview || 'No preview available'}
            </Text>
          </View>
        );
      case 'image':
        return (
          <View style={styles.contentContainer}>
            <Image
              source={{ uri: item.path }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          </View>
        );
      case 'video':
        return (
          <View style={styles.contentContainer}>
            {fileInfo.thumbnail ? (
              <Image
                source={{ uri: fileInfo.thumbnail }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <Text>No thumbnail available</Text>
            )}
            <Text style={styles.duration}>
              Duration: {fileInfo.duration || 'Unknown'}
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.contentContainer}>
            <Text>No preview available</Text>
          </View>
        );
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={toggleExpanded}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{fileInfo.name}</Text>
          <Text style={styles.filePath}>{fileInfo.path}</Text>
          <Text style={styles.fileType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>
            Score: {typeof item.score === 'number' ? Number(item.score).toFixed(2) : 'N/A'}
          </Text>
        </View>
      </View>
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fileInfo: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filePath: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    color: '#4A55A2',
    fontWeight: 'bold',
  },
  scoreContainer: {
    justifyContent: 'center',
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A55A2',
  },
  contentContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  preview: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 6,
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default ResultItem;