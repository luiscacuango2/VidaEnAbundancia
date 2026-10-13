// src/screens/main/QuizScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Title,
  ActivityIndicator,
  IconButton,
  Card,
  Button,
  RadioButton,
  ProgressBar,
  Paragraph,
} from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

interface QuizWithOptions {
  id: string;
  question: string;
  question_type: string;
  explanation: string | null;
  order_number: number;
  quiz_options: {
    id: string;
    option_text: string;
    is_correct: boolean;
    order_number: number;
  }[];
}

export default function QuizScreen({ route, navigation }: Props) {
  const { lessonId, lessonTitle } = route.params;
  const { user } = useAuth();

  const [quizzes, setQuizzes] = useState<QuizWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // ============================================
  // CARGAR QUIZZES
  // ============================================
  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        id,
        question,
        question_type,
        explanation,
        order_number,
        quiz_options (
          id,
          option_text,
          is_correct,
          order_number
        )
      `)
      .eq('lesson_id', lessonId)
      .order('order_number', { ascending: true });

    if (error) {
      console.error('Error cargando quizzes:', error);
      Alert.alert('Error', 'No se pudieron cargar las preguntas.');
    } else {
      const sortedQuizzes = (data || []).map((quiz: any) => ({
        ...quiz,
        quiz_options: quiz.quiz_options.sort(
          (a: any, b: any) => a.order_number - b.order_number
        ),
      }));
      setQuizzes(sortedQuizzes);
    }
    setLoading(false);
  };

  // ============================================
  // DESBLOQUEAR UN LOGRO
  // ============================================
  const unlockAchievement = async (achievementCode: string) => {
    if (!user) return;

    try {
      const { data: achievementData } = await supabase
        .from('achievements')
        .select('id, title, points_reward')
        .eq('code', achievementCode)
        .single();

      if (!achievementData) return;

      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_id', achievementData.id)
        .maybeSingle();

      if (existing) return;

      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementData.id,
        });

      if (insertError) throw insertError;

      if (achievementData.points_reward > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', user.id)
          .single();

        const newTotal =
          (profile?.total_points || 0) + achievementData.points_reward;

        await supabase
          .from('profiles')
          .update({ total_points: newTotal })
          .eq('id', user.id);
      }

      Alert.alert(
        '🏆 ¡Logro Desbloqueado!',
        `"${achievementData.title}"\n+${achievementData.points_reward} puntos`,
        [{ text: '¡Genial!' }]
      );
    } catch (error) {
      console.error('Error desbloqueando logro:', error);
    }
  };

  // ============================================
  // VERIFICAR Y DESBLOQUEAR LOGROS
  // ============================================
  const checkAchievements = async (
    lessonIdParam: string,
    correctAnswersParam: number,
    totalQuestionsParam: number
  ) => {
    if (!user) return;

    try {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('order_number, volume_id, volumes(order_number)')
        .eq('id', lessonIdParam)
        .single();

      if (!lessonData) return;

      const lessonNumber = lessonData.order_number;
      const volumeNumber = (lessonData as any).volumes?.order_number;

      // Logros por lección específica (Volumen 0)
      if (volumeNumber === 0) {
        const achievementCodes: { [key: number]: string } = {
          1: 'vol0_first_step',
          2: 'vol0_cordero',
          3: 'vol0_pastor',
          4: 'vol0_vivo',
          5: 'vol0_abogado',
          6: 'vol0_rey',
        };

        const achievementCode = achievementCodes[lessonNumber];
        if (achievementCode) {
          await unlockAchievement(achievementCode);
        }
      }

      // Logro por completar el Volumen 0
      if (volumeNumber === 0) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select(`
            lesson_id,
            lessons!inner(order_number, volume_id)
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const completedLessonsInVolume = (progressData || []).filter(
          (p: any) => p.lessons?.volume_id === lessonData.volume_id
        ).length;

        if (completedLessonsInVolume >= 6) {
          await unlockAchievement('vol0_complete');
        }
      }

      // Logro de puntuación perfecta
      if (
        correctAnswersParam === totalQuestionsParam &&
        totalQuestionsParam > 0
      ) {
        await unlockAchievement('perfect_score');
      }
    } catch (error) {
      console.error('Error verificando logros:', error);
    }
  };

  // ============================================
  // SELECCIONAR OPCIÓN
  // ============================================
  const handleSelectOption = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
  };

  // ============================================
  // RESPONDER
  // ============================================
  const handleSubmit = () => {
    if (!selectedOption) {
      Alert.alert(
        'Selecciona una opción',
        'Por favor, elige una respuesta antes de continuar.'
      );
      return;
    }

    const currentQuiz = quizzes[currentIndex];
    const option = currentQuiz.quiz_options.find((o) => o.id === selectedOption);
    const correct = option?.is_correct || false;

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  // ============================================
  // GUARDAR PROGRESO Y LOGROS
  // ============================================
  const finishQuiz = async () => {
    console.log('🟡 finishQuiz iniciado');

    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return;
    }

    const totalQuestions = quizzes.length;
    const finalCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers;
    const score = Math.round((finalCorrectAnswers / totalQuestions) * 100);
    const pointsEarned = finalCorrectAnswers * 10;

    console.log('📊 Datos del quiz:', {
      totalQuestions,
      finalCorrectAnswers,
      score,
      pointsEarned,
    });

    try {
      // Guardar el progreso
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            status: 'completed',
            score: score,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,lesson_id',
          }
        );

      if (progressError) throw progressError;

      // Actualizar puntos del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      const newTotal = (profile?.total_points || 0) + pointsEarned;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ total_points: newTotal })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Verificar logros
      await checkAchievements(lessonId, finalCorrectAnswers, totalQuestions);

      // Notificación final
      Alert.alert(
        '¡Felicidades! 🎉',
        `Has completado el quiz.\n\nRespuestas correctas: ${finalCorrectAnswers}/${totalQuestions}\nPuntaje: ${score}%\nPuntos ganados: +${pointsEarned}`,
        [{ text: 'Volver', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error guardando progreso:', error);
      Alert.alert('Error', 'No se pudo guardar tu progreso.');
    }
  };

  // ============================================
  // SIGUIENTE PREGUNTA
  // ============================================
  const handleNext = async () => {
    console.log('🔵 handleNext llamado. currentIndex:', currentIndex);
    console.log('🔵 Total quizzes:', quizzes.length);
    console.log('🔵 isCorrect:', isCorrect);
    console.log('🔵 correctAnswers:', correctAnswers);

    if (currentIndex < quizzes.length - 1) {
      console.log('🟢 Avanzando a siguiente pregunta');
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      console.log('🔴 Última pregunta. Llamando a finishQuiz...');
      try {
        await finishQuiz();
        console.log('✅ finishQuiz completado');
      } catch (error) {
        console.error('❌ Error en finishQuiz:', error);
      }
    }
  };

  // ============================================
  // SALIR DEL QUIZ
  // ============================================
  const handleQuit = () => {
    Alert.alert(
      'Salir del Quiz',
      '¿Estás seguro de que quieres salir? Tu progreso no se guardará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (quizzes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor="#fff"
            size={24}
            onPress={handleQuit}
          />
          <Title style={styles.headerTitle}>Quiz</Title>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Esta lección aún no tiene preguntas disponibles.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          >
            Volver
          </Button>
        </View>
      </View>
    );
  }

  const currentQuiz = quizzes[currentIndex];
  const progress = (currentIndex + 1) / quizzes.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="close" iconColor="#fff" size={24} onPress={handleQuit} />
        <Title style={styles.headerTitle} numberOfLines={1}>
          {lessonTitle}
        </Title>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Pregunta {currentIndex + 1} de {quizzes.length}
        </Text>
        <ProgressBar
          progress={progress}
          color="#2E7D32"
          style={styles.progressBar}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.questionCard}>
          <Card.Content>
            <Title style={styles.questionText}>{currentQuiz.question}</Title>
          </Card.Content>
        </Card>

        <View style={styles.optionsContainer}>
          {currentQuiz.quiz_options.map((option) => {
            const isSelected = selectedOption === option.id;
            const showCorrect = isAnswered && option.is_correct;
            const showWrong = isAnswered && isSelected && !option.is_correct;

            return (
              <Card
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionSelected,
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                ]}
                onPress={() => handleSelectOption(option.id)}
              >
                <Card.Content style={styles.optionContent}>
                  <RadioButton
                    value={option.id}
                    status={isSelected ? 'checked' : 'unchecked'}
                    onPress={() => handleSelectOption(option.id)}
                    disabled={isAnswered}
                    color="#2E7D32"
                  />
                  <Text style={styles.optionText}>{option.option_text}</Text>
                  {showCorrect && <Text style={styles.checkIcon}>✅</Text>}
                  {showWrong && <Text style={styles.checkIcon}>❌</Text>}
                </Card.Content>
              </Card>
            );
          })}
        </View>

        {isAnswered && (
          <Card
            style={[
              styles.feedbackCard,
              isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            <Card.Content>
              <Title style={styles.feedbackTitle}>
                {isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto'}
              </Title>
              {currentQuiz.explanation && (
                <Paragraph style={styles.feedbackText}>
                  {currentQuiz.explanation}
                </Paragraph>
              )}
            </Card.Content>
          </Card>
        )}

        {!isAnswered ? (
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!selectedOption}
            style={styles.actionButton}
          >
            Responder
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.actionButton}
          >
            {currentIndex < quizzes.length - 1
              ? 'Siguiente Pregunta'
              : 'Finalizar Quiz'}
          </Button>
        )}
      </ScrollView>
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
  headerTitle: { color: '#fff', fontSize: 16, flex: 1, textAlign: 'center' },
  progressContainer: { padding: 16, backgroundColor: '#fff' },
  progressText: { fontSize: 14, color: '#666', marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  questionCard: { marginBottom: 16, backgroundColor: '#fff' },
  questionText: { fontSize: 18, color: '#333' },
  optionsContainer: { marginBottom: 16 },
  optionCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionSelected: { borderColor: '#2E7D32', borderWidth: 2 },
  optionCorrect: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
  optionWrong: { borderColor: '#F44336', backgroundColor: '#FFEBEE' },
  optionContent: { flexDirection: 'row', alignItems: 'center' },
  optionText: { flex: 1, fontSize: 16, color: '#333' },
  checkIcon: { fontSize: 20 },
  feedbackCard: { marginBottom: 16 },
  feedbackCorrect: { backgroundColor: '#E8F5E9' },
  feedbackWrong: { backgroundColor: '#FFEBEE' },
  feedbackTitle: { fontSize: 18, marginBottom: 8 },
  feedbackText: { fontSize: 15, color: '#555', lineHeight: 22 },
  actionButton: { paddingVertical: 6 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
});