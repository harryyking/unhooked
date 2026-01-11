import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Shield, Zap, Star, Lock, Check, X, Crown, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur'; // Optional: If you use expo-blur, otherwise View with opacity

// --- UI Components ---
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'weekly_pro',
    name: 'Weekly',
    price: '$4.99',
    description: 'Billed every 7 days',
    tag: null,
  },
  {
    id: 'yearly_pro',
    name: 'Annual',
    price: '$39.99',
    description: '$3.33 / month',
    tag: 'SAVE 80%',
    isBestValue: true,
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('yearly_pro');
  const [showClose, setShowClose] = useState(false);

  // 3-second delay before allowing close (conversion tactic)
  useEffect(() => {
    const timer = setTimeout(() => setShowClose(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePurchase = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Integrate RevenueCat / StoreKit purchase logic here
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      {/* Consistent Background Gradient */}
      <LinearGradient
        colors={['#020617', '#082f49', '#0d9488']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.proBadge}>
            <Crown size={14} color="#0d9488" strokeWidth={3} />
            <Text style={styles.proBadgeText}>PRO ACCESS</Text>
          </View>
          
          <AnimatePresence>
            {showClose && (
              <MotiView 
                from={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }}
                style={styles.closeButtonContainer}
              >
                <TouchableOpacity 
                  onPress={() => router.back()} 
                  style={styles.closeButton}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <X size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </MotiView>
            )}
          </AnimatePresence>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* --- HERO SECTION --- */}
          <View style={styles.heroSection}>
            <MotiView
              from={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'timing', duration: 1000, loop: true }}
              style={styles.heroIconContainer}
            >
              <Crown size={48} color="#FFF" strokeWidth={1.5} />
            </MotiView>
            
            <Text style={styles.heroTitle}>
              Unlock Your Full{'\n'}Potential
            </Text>
            <Text style={styles.heroSubtitle}>
              Join thousands of men reclaiming their freedom.
            </Text>
          </View>

          {/* --- FEATURES --- */}
          <View style={styles.featuresContainer}>
            <FeatureRow 
              icon={<Zap size={20} color="#5eead4" />} 
              title="Neuro-shield Blocking" 
              subtitle="Advanced AI protection across apps." 
            />
            <FeatureRow 
              icon={<Shield size={20} color="#5eead4" />} 
              title="Panic Button Access" 
              subtitle="Instant spiritual anchors for urges." 
            />
            <FeatureRow 
              icon={<TrendingUp size={20} color="#5eead4" />} 
              title="Recovery Analytics" 
              subtitle="Visualize your brain rewiring." 
            />
          </View>

          {/* --- PRICING CARDS --- */}
          <View style={styles.plansContainer}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              
              return (
                <TouchableOpacity
                  key={plan.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedPlan(plan.id);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected
                  ]}
                >
                  {/* Radio / Check Circle */}
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>

                  {/* Text Content */}
                  <View style={styles.planContent}>
                    <Text style={[styles.planName, isSelected && styles.textSelected]}>
                      {plan.name}
                    </Text>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  </View>

                  {/* Price & Tag */}
                  <View style={styles.planRight}>
                    <Text style={[styles.planPrice, isSelected && styles.textSelected]}>
                      {plan.price}
                    </Text>
                    {plan.tag && (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{plan.tag}</Text>
                      </View>
                    )}
                  </View>

                  {/* Active Border Glow (Visual Trick) */}
                  {isSelected && <View style={styles.activeBorder} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- TRUST BADGES --- */}
          <View style={styles.trustContainer}>
            <Lock size={12} color="rgba(255,255,255,0.4)" />
            <Text style={styles.trustText}>SECURED BY APPLE</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <TouchableOpacity>
              <Text style={styles.restoreText}>RESTORE PURCHASE</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* --- FOOTER ACTION --- */}
        <View style={styles.footer}>
          <Button 
            onPress={handlePurchase}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Start Free Trial</Text>
          </Button>
          <Text style={styles.termsText}>
            7 days free, then $39.99/year. Cancel anytime.
          </Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

// --- SUB-COMPONENTS ---

function FeatureRow({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconBox}>
        {icon}
      </View>
      <View style={styles.featureTextBox}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.1)', // Teal-tinted
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
  },
  proBadgeText: {
    color: '#2dd4bf', // Teal-400
    fontSize: 10,
    fontFamily: 'Sans-Bold',
    letterSpacing: 1,
  },
  closeButtonContainer: {
    // Positioning handled by layout
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },

  // Content
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    shadowColor: '#2dd4bf',
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 32,
    fontFamily: 'Serif-Regular', // Consistent with titles
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Sans-Regular',
    maxWidth: '80%',
  },

  // Features
  featuresContainer: {
    paddingHorizontal: 24,
    gap: 20,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(94, 234, 212, 0.1)', // Teal tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Sans-Bold',
    marginBottom: 2,
  },
  featureSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: 'Sans-Regular',
  },

  // Plans
  plansContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative', // For active border
    overflow: 'hidden',
  },
  planCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: '#FFF',
  },
  activeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 20,
    opacity: 0.5,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  radioCircleSelected: {
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#020617', // Dark dot
  },
  planContent: {
    flex: 1,
  },
  planName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontFamily: 'Sans-Bold',
  },
  textSelected: {
    color: '#FFF',
  },
  planDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Sans-Regular',
  },
  planRight: {
    alignItems: 'flex-end',
  },
  planPrice: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontFamily: 'Sans-Bold',
  },
  tagBadge: {
    backgroundColor: '#0d9488', // Teal badge
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  tagText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Sans-Bold',
  },

  // Trust & Footer
  trustContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
    opacity: 0.6,
  },
  trustText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Sans-Bold',
    letterSpacing: 0.5,
  },
  dotSeparator: {
    color: '#FFF',
    fontSize: 10,
  },
  restoreText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Sans-Bold',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 10,
  },
  ctaButton: {
    backgroundColor: '#FFF', // White button for high contrast
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FFF',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: {
    color: '#020617', // Dark text
    fontSize: 17,
    fontFamily: 'Sans-Bold',
  },
  termsText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'Sans-Regular',
  },
});