import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Unlock Full Freedom</Text>
        <Text style={styles.subtitle}>Join 10,000+ believers walking in light.</Text>
      </View>

      <View style={styles.pricingCard}>
        <Text style={styles.price}>$9.99<Text style={styles.period}>/mo</Text></Text>
        <Text style={styles.feature}>• Unlimited Allies</Text>
        <Text style={styles.feature}>• Advanced Shielding</Text>
        <Text style={styles.feature}>• AI Bible Companion</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => router.push('/(auth)/login')} // Goes to Auth Screen
        >
          <Text style={styles.primaryText}>Start 7-Day Free Trial</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>Restore Purchase</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
// Styles omitted for brevity, stick to dark theme 
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'space-between' },
    header: { padding: 30, paddingTop: 60 },
    title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
    subtitle: { fontSize: 18, color: '#94a3b8', marginTop: 10 },
    pricingCard: { margin: 20, padding: 30, backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1, borderColor: '#4ADE80' },
    price: { fontSize: 48, fontWeight: 'bold', color: 'white' },
    period: { fontSize: 18, color: '#94a3b8' },
    feature: { color: 'white', fontSize: 18, marginTop: 15 },
    footer: { padding: 20 },
    primaryButton: { backgroundColor: '#4ADE80', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
    primaryText: { color: '#064E3B', fontWeight: 'bold', fontSize: 18 },
    link: { color: '#94a3b8', textAlign: 'center' }
});