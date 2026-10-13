// src/screens/main/VolumeDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Lesson, UserProgress, Profile } from '../../types/database';
import { generateCertificate } from '../../utils/certificateGenerator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'VolumeDetail'>;

interface LessonWithProgress extends Lesson {
  status: 'not_started' | 'in_progress' | 'completed';
}

export default function VolumeDetailScreen({ route, navigation }: Props) {
  const { volumeId, volumeTitle } = route.params;
  const { user } = useAuth();
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCert, setGeneratingCert] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Obtener lecciones
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('volume_id', volumeId)
        .order('order_number', { ascending: true });

      if (lessonsError) throw lessonsError;

      // 2. Obtener el progreso del usuario para estas lecciones
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('lesson_id, status')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      const progressMap = new Map(
        (progressData || []).map((p: any) => [p.lesson_id, p.status])
      );

      const lessonsWithProgress: LessonWithProgress[] = (lessonsData || []).map(
        (lesson: Lesson) => ({
          ...lesson,
          status: (progressMap.get(lesson.id) as any) || 'not_started',
        })
      );

      setLessons(lessonsWithProgress);
    } catch (error) {
      console.error('Error cargando lecciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = lessons.filter((l) => l.status === 'completed').length;
  const totalCount = lessons.length;
  const isCompleted = totalCount > 0 && completedCount === totalCount;

  const handleGenerateCertificate = async () => {
    if (!user) return;
    setGeneratingCert(true);

    try {
      // Obtener el perfil del usuario para el nombre y los puntos
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, total_points')
        .eq('id', user.id)
        .single();

      const userName = profile?.full_name || profile?.username || user.email || 'Estudiante';
      const completedDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Extraer el número del volumen del título
      const volumeNumberMatch = volumeTitle.match(/Vol\.\s*(\d+)/);
      const volumeNumber = volumeNumberMatch ? parseInt(volumeNumberMatch[1]) : 0;

      // Limpiar el título (quitar "Vol. X: ")
      const cleanTitle = volumeTitle.replace(/Vol\.\s*\d+:\s*/, '');

      const result = await generateCertificate({
        userName,
        volumeTitle: cleanTitle,
        volumeNumber,
        completedDate,
        totalPoints: profile?.total_points || 0,
      });

      if (!result.success) {
        Alert.alert('Error', 'No se pudo generar el certificado.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Ocurrió un error generando el certificado.');
    } finally {
      setGeneratingCert(false);
    }
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

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Progreso: {completedCount}/{totalCount} lecciones
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${
                  totalCount > 0 ? (completedCount / totalCount) * 100 : 0
                }%`,
              },
            ]}
          />
        </View>
      </View>

      {isCompleted && (
        <Card style={styles.certificateCard}>
          <Card.Content>
            <Title style={styles.certificateTitle}>
              🎉 ¡Felicidades! Has completado este volumen.
            </Title>
            <Text style={styles.certificateText}>
              Descarga tu certificado de finalización.
            </Text>
            <Button
              mode="contained"
              icon="certificate"
              onPress={handleGenerateCertificate}
              loading={generatingCert}
              disabled={generatingCert}
              style={styles.certificateButton}
              buttonColor="#FF9800"
            >
              Descargar Certificado
            </Button>
          </Card.Content>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Lecciones</Text>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
                <View
                  style={[
                    styles.lessonNumber,
                    item.status === 'completed' && styles.lessonNumberCompleted,
                  ]}
                >
                  <Text style={styles.lessonNumberText}>
                    {item.status === 'completed' ? '✓' : item.order_number}
                  </Text>
                </View>
                <View style={styles.lessonInfo}>
                  <Title style={styles.lessonTitle}>{item.title}</Title>
                  {item.memory_verse && (
                    <Text style={styles.verseText}>📖 {item.memory_verse}</Text>
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
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  certificateCard: {
    margin: 16,
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  certificateTitle: { fontSize: 18, color: '#E65100', marginBottom: 8 },
  certificateText: { fontSize: 14, color: '#555', marginBottom: 16 },
  certificateButton: { paddingVertical: 6 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    color: '#333',
  },
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
  lessonNumberCompleted: {
    backgroundColor: '#4CAF50',
  },
  lessonNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 16, marginBottom: 4 },
  verseText: { color: '#666', fontSize: 12 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', textAlign: 'center' },
});