import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import database from '@react-native-firebase/database';

export default function App() {
  useEffect(() => {
    database().setPersistenceEnabled(false);
    console.log('[Firebase] initialized, persistence OFF');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello QBT Live</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#e6edf3', fontSize: 20 },
});
