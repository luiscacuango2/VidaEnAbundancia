// src/screens/main/VolumeDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { Lesson } from '../../types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'VolumeDetail'>;

export default function VolumeDetailScreen({ route, navigation }: Props) {
  const { volumeId, volumeTitle } = route.params;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('volume_id', volumeId)
      .order('order_number', { ascending: true });

    if (error) {
      console.error('Error cargando lecciones:', error);
    } else {
      setLessons(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Title style={styles.headerTitle} numberOfLines={1}>
          {volumeTitle}
        </Title>
        <View style={{ width: 48 }} />
      </View>

      <Text style={styles.sectionTitle}>Lecciones</Text>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate('LessonDetail', {
                lessonId: item.id,
                lessonTitle: item.title,
              })
            }
          >
            <Card.Content>
              <View style={styles.lessonRow}>
                <View style={styles.lessonNumber}>
                  <Text style={styles.lessonNumberText}>{item.order_number}</Text>
                </View>
                <View style={styles.lessonInfo}>
                  <Title style={styles.lessonTitle}>{item.title}</Title>
                  {item.memory_verse && (
                    <Text style={styles.verseText}>
                      📖 {item.memory_verse}
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Este volumen aún no tiene lecciones publicadas.
            </Text>
          </View>
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
  sectionTitle: { fontSize: 20, fontWeight: 'bold', padding: 16, color: '#333' },
  card: { marginHorizontal: 16, marginBottom: 12 },
  lessonRow: { flexDirection: 'row', alignItems: 'center' },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 16, marginBottom: 4 },
  verseText: { color: '#666', fontSize: 12 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', textAlign: 'center' },
});