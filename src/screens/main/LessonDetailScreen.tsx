// src/screens/main/LessonDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Title, ActivityIndicator, IconButton, Card, Divider, Button } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { Lesson } from '../../types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonDetail'>;

export default function LessonDetailScreen({ route, navigation }: Props) {
  const { lessonId, lessonTitle } = route.params;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLesson();
  }, []);

  const fetchLesson = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (error) {
      console.error('Error cargando lección:', error);
    } else {
      setLesson(data);
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

  if (!lesson) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No se encontró la lección.</Text>
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
          {lessonTitle}
        </Title>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.lessonTitle}>{lesson.title}</Title>

        {lesson.memory_verse && (
          <Card style={styles.verseCard}>
            <Card.Content>
              <Text style={styles.verseLabel}>📖 Versículo para memorizar</Text>
              <Text style={styles.verseText}>{lesson.memory_verse}</Text>
            </Card.Content>
          </Card>
        )}

        {lesson.bible_reading && (
          <Card style={styles.readingCard}>
            <Card.Content>
              <Text style={styles.readingLabel}>📚 Lectura bíblica</Text>
              <Text style={styles.readingText}>{lesson.bible_reading}</Text>
            </Card.Content>
          </Card>
        )}

        <Divider style={styles.divider} />

        <Title style={styles.sectionTitle}>Contenido de la Lección</Title>
        <Text style={styles.content}>
          {lesson.content || 'Contenido no disponible.'}
        </Text>

        <Button
          mode="contained"
          onPress={() => console.log('Iniciar quiz')}
          style={styles.quizButton}
          icon="pencil"
        >
          Comenzar Quiz
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  scrollContent: { padding: 16 },
  lessonTitle: { fontSize: 24, marginBottom: 16, color: '#2E7D32' },
  verseCard: { backgroundColor: '#E8F5E9', marginBottom: 12 },
  verseLabel: { fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
  verseText: { fontStyle: 'italic', color: '#333' },
  readingCard: { backgroundColor: '#FFF3E0', marginBottom: 12 },
  readingLabel: { fontWeight: 'bold', color: '#E65100', marginBottom: 4 },
  readingText: { color: '#333' },
  divider: { marginVertical: 16 },
  sectionTitle: { fontSize: 18, marginBottom: 12 },
  content: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 24 },
  quizButton: { paddingVertical: 6 },
});