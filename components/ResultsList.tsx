import React from 'react';
import { StyleSheet, View, Text, FlatList, ListRenderItem } from 'react-native';
import ResultItem from './ResultItem';
import { SearchResult } from '@/services/searchService';

export interface ResultItemType {
  id: string;
  [key: string]: unknown;
}

export interface ResultsListProps {
  results: SearchResult[];
}

const ResultsList: React.FC<ResultsListProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No results found. Try searching for something else or add more files.
        </Text>
      </View>
    );
  }

  const renderItem: ListRenderItem<SearchResult> = ({ item }) => (
    <ResultItem item={item} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Results ({results.length})</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
});

export default ResultsList;