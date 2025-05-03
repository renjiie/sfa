import { debounce } from 'lodash';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
  onSearch: (searchQuery: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  // Debounce search to prevent too many search calls
  const debouncedSearch = React.useMemo(
    () =>
      debounce((searchQuery) => {
        onSearch(searchQuery);
      }, 300),
    [onSearch]
  );

const handleSearchChange: (text: string) => void = (text) => {
    setQuery(text);
    debouncedSearch(text);
};

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search your files..."
        value={query}
        onChangeText={handleSearchChange}
        clearButtonMode="while-editing"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default SearchBar;