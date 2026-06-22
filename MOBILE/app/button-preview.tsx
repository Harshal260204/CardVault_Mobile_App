import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Button, ButtonSize, ButtonVariant } from '@/components/Button';
import { space } from '@/tokens/spacing';

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

export default function ButtonPreview() {
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="h1" style={styles.title}>Button Preview</Text>
        
        <View style={styles.controls}>
          <Button 
            label={loading ? "Stop Loading" : "Trigger Global Loading"} 
            variant="secondary"
            onPress={() => setLoading(!loading)} 
          />
        </View>

        {variants.map((variant) => (
          <View key={variant} style={styles.section}>
            <Text variant="h2" style={styles.sectionTitle}>{variant}</Text>
            {sizes.map((size) => (
              <View key={size} style={styles.row}>
                <Text variant="body" style={styles.sizeLabel}>{size}:</Text>
                <Button
                  variant={variant}
                  size={size}
                  label={`${variant} ${size}`}
                  onPress={() => console.log(`${variant} ${size} pressed`)}
                  isLoading={loading}
                />
              </View>
            ))}
            <View style={styles.row}>
              <Text variant="body" style={styles.sizeLabel}>disabled:</Text>
              <Button
                variant={variant}
                size="md"
                label={`${variant} disabled`}
                onPress={() => {}}
                isDisabled
              />
            </View>
            <View style={styles.row}>
              <Text variant="body" style={styles.sizeLabel}>fullWidth:</Text>
              <View style={{ flex: 1 }}>
                <Button
                  variant={variant}
                  size="md"
                  label="Full Width Button"
                  onPress={() => {}}
                  fullWidth
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: space[4],
  },
  title: {
    marginBottom: space[6],
  },
  controls: {
    marginBottom: space[6],
  },
  section: {
    marginBottom: space[8],
  },
  sectionTitle: {
    marginBottom: space[4],
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[3],
  },
  sizeLabel: {
    width: 80,
    marginRight: space[2],
  },
});
