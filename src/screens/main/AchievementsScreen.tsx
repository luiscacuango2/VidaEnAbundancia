// src/screens/main/AchievementsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  Title,
  ActivityIndicator,
  Card,
  IconButton,
  Avatar,
} from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Achievement } from '../../types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlocked_at: string | null;
}

export default function AchievementsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Obtener todos los logros
      const { data: allAchievements, error: achError } = await supabase
        .from('achievements')
        .select('*')
        .order('points_reward', { ascending: true });

      if (achError) throw achError;

      // 2. Obtener los logros desbloqueados por el usuario
      const { data: userAchievements, error: userAchError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      if (userAchError) throw userAchError;

      const unlockedMap = new Map(
        (userAchievements || []).map((ua: any) => [
          ua.achievement_id,
          ua.unlocked_at,
        ])
      );

      // 3. Combinar
      const combined: AchievementWithStatus[] = (allAchievements || []).map(
        (ach: Achievement) => ({
          ...ach,
          unlocked: unlockedMap.has(ach.id),
          unlocked_at: unlockedMap.get(ach.id) || null,
        })
      );

      setAchievements(combined);
    } catch (error) {
      console.error('Error cargando logros:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Title style={styles.headerTitle}>Mis Logros</Title>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          🏆 {unlockedCount} de {achievements.length} logros desbloqueados
        </Text>
      </View>

      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card
            style={[
              styles.card,
              item.unlocked ? styles.cardUnlocked : styles.cardLocked,
            ]}
          >
            <Card.Content style={styles.cardContent}>
              <Avatar.Text
                size={50}
                label={item.unlocked ? '🏆' : '🔒'}
                style={[
                  styles.avatar,
                  item.unlocked ? styles.avatarUnlocked : styles.avatarLocked,
                ]}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.cardInfo}>
                <Title
                  style={[
                    styles.cardTitle,
                    !item.unlocked && styles.cardTitleLocked,
                  ]}
                >
                  {item.title}
                </Title>
                <Text
                  style={[
                    styles.cardDescription,
                    !item.unlocked && styles.cardDescriptionLocked,
                  ]}
                >
                  {item.description || 'Sin descripción'}
                </Text>
                {item.unlocked && item.unlocked_at && (
                  <Text style={styles.unlockedDate}>
                    Desbloqueado el{' '}
                    {new Date(item.unlocked_at).toLocaleDateString('es-ES')}
                  </Text>
                )}
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>+{item.points_reward}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay logros disponibles aún.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 40,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, flex: 1, textAlign: 'center' },
  statsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  listContent: { padding: 16 },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardUnlocked: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardLocked: {
    borderLeftWidth: 4,
    borderLeftColor: '#BDBDBD',
    opacity: 0.7,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: { marginRight: 12 },
  avatarUnlocked: { backgroundColor: '#E8F5E9' },
  avatarLocked: { backgroundColor: '#EEEEEE' },
  avatarLabel: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, marginBottom: 4, color: '#333' },
  cardTitleLocked: { color: '#999' },
  cardDescription: { fontSize: 13, color: '#666', marginBottom: 4 },
  cardDescriptionLocked: { color: '#AAA' },
  unlockedDate: { fontSize: 11, color: '#4CAF50', fontStyle: 'italic' },
  pointsBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  pointsText: { fontSize: 14, fontWeight: 'bold', color: '#E65100' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 32 },
});