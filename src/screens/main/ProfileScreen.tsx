// src/screens/main/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
    Text,
    Title,
    ActivityIndicator,
    Card,
    Avatar,
    Button,
    Divider,
    ProgressBar,
    IconButton,
} from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Profile, UserProgress, Volume } from '../../types/database';

interface VolumeProgress {
    volume: Volume;
    completedLessons: number;
    totalLessons: number;
    percentage: number;
}

export default function ProfileScreen({ navigation }: any) {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [volumesProgress, setVolumesProgress] = useState<VolumeProgress[]>([]);
    const [stats, setStats] = useState({
        totalLessons: 0,
        completedLessons: 0,
        averageScore: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Obtener el perfil del usuario
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // 2. Obtener todos los volúmenes publicados con sus lecciones
            const { data: volumesData, error: volumesError } = await supabase
                .from('volumes')
                .select(`
    *,
    lessons (id)
  `)
                .eq('is_published', true)
                .order('order_number', { ascending: true });

            if (volumesError) throw volumesError;

            // 3. Obtener el progreso del usuario
            const { data: progressData, error: progressError } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'completed');

            if (progressError) throw progressError;

            const completedLessonIds = new Set(
                (progressData || []).map((p: UserProgress) => p.lesson_id)
            );

            // 4. Calcular progreso por volumen
            const volumeProgressList: VolumeProgress[] = (volumesData || [])
                .filter((vol: any) => vol.lessons && vol.lessons.length > 0) // ← Filtra volúmenes sin lecciones
                .map((vol: any) => {
                    const totalLessons = vol.lessons?.length || 0;
                    const completedInVolume = (vol.lessons || []).filter((l: any) =>
                        completedLessonIds.has(l.id)
                    ).length;
                    const percentage =
                        totalLessons > 0 ? (completedInVolume / totalLessons) * 100 : 0;

                    return {
                        volume: vol,
                        completedLessons: completedInVolume,
                        totalLessons: totalLessons,
                        percentage: Math.round(percentage),
                    };
                });

            setVolumesProgress(volumeProgressList);

            // 5. Calcular estadísticas generales
            const totalLessons = volumeProgressList.reduce(
                (sum, v) => sum + v.totalLessons,
                0
            );
            const completedLessons = volumeProgressList.reduce(
                (sum, v) => sum + v.completedLessons,
                0
            );
            const averageScore =
                (progressData || []).length > 0
                    ? Math.round(
                        (progressData || []).reduce(
                            (sum: number, p: UserProgress) => sum + p.score,
                            0
                        ) / (progressData || []).length
                    )
                    : 0;

            setStats({
                totalLessons,
                completedLessons,
                averageScore,
            });
        } catch (error) {
            console.error('Error cargando perfil:', error);
            Alert.alert('Error', 'No se pudo cargar el perfil.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: () => signOut() },
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

    const getInitials = (
        name: string | null | undefined,
        email: string | null | undefined
    ) => {
        if (name) return name.charAt(0).toUpperCase();
        if (email) return email.charAt(0).toUpperCase();
        return '?';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    iconColor="#fff"
                    size={24}
                    onPress={() => navigation.goBack()}
                />
                <Title style={styles.headerTitle}>Mi Perfil</Title>
                <IconButton
                    icon="logout"
                    iconColor="#fff"
                    size={24}
                    onPress={handleSignOut}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Información del usuario */}
                <View style={styles.profileHeader}>
                    <Avatar.Text
                        size={80}
                        label={getInitials(profile?.full_name, user?.email)}
                        style={styles.avatar}
                        labelStyle={styles.avatarLabel}
                    />
                    <Title style={styles.userName}>
                        {profile?.full_name || 'Usuario'}
                    </Title>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Estadísticas principales */}
                <Card style={styles.statsCard}>
                    <Card.Content>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{profile?.total_points || 0}</Text>
                                <Text style={styles.statLabel}>Puntos</Text>
                            </View>
                            <Divider style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>
                                    {stats.completedLessons}/{stats.totalLessons}
                                </Text>
                                <Text style={styles.statLabel}>Lecciones</Text>
                            </View>
                            <Divider style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.averageScore}%</Text>
                                <Text style={styles.statLabel}>Promedio</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Botón para ver logros */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Button
                            mode="contained"
                            icon="trophy"
                            onPress={() => navigation.navigate('Achievements')}
                            style={styles.achievementsButton}
                            buttonColor="#FF9800"
                            textColor="#fff"
                        >
                            Ver Mis Logros
                        </Button>
                    </Card.Content>
                </Card>

                {/* Progreso general */}
                <Card style={styles.generalProgressCard}>
                    <Card.Content>
                        <View style={styles.generalProgressHeader}>
                            <Title style={styles.generalProgressTitle}>Progreso General</Title>
                            <Text style={styles.generalProgressPercentage}>
                                {stats.totalLessons > 0
                                    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
                                    : 0}
                                %
                            </Text>
                        </View>
                        <ProgressBar
                            progress={
                                stats.totalLessons > 0
                                    ? stats.completedLessons / stats.totalLessons
                                    : 0
                            }
                            color="#2E7D32"
                            style={styles.generalProgressBar}
                        />
                    </Card.Content>
                </Card>

                {/* Título de sección separado con espacio */}
                <Title style={styles.sectionTitle}>Progreso por Volumen</Title>

                {volumesProgress.map((vp) => (
                    <Card key={vp.volume.id} style={styles.volumeCard}>
                        <Card.Content>
                            <View style={styles.volumeHeader}>
                                <Text style={styles.volumeTitle}>
                                    Vol. {vp.volume.order_number}: {vp.volume.title}
                                </Text>
                                <Text style={styles.volumePercentage}>{vp.percentage}%</Text>
                            </View>
                            <ProgressBar
                                progress={vp.percentage / 100}
                                color={vp.percentage === 100 ? '#4CAF50' : '#2E7D32'}
                                style={styles.progressBar}
                            />
                            {vp.totalLessons > 0 && (
                                <Text style={styles.volumeProgressText}>
                                    {vp.completedLessons} de {vp.totalLessons} lecciones completadas
                                    {vp.percentage === 100 && ' ✅'}
                                </Text>
                            )}
                        </Card.Content>
                    </Card>
                ))}

                {volumesProgress.length === 0 && (
                    <Text style={styles.emptyText}>
                        Aún no hay volúmenes disponibles.
                    </Text>
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
    headerTitle: { color: '#fff', fontSize: 18, flex: 1, textAlign: 'center' },
    scrollContent: { padding: 16, paddingBottom: 32 },
    profileHeader: { alignItems: 'center', marginBottom: 24 },
    avatar: { backgroundColor: '#2E7D32', marginBottom: 12 },
    avatarLabel: { color: '#fff', fontSize: 32 },
    userName: { fontSize: 22, color: '#333', marginBottom: 4 },
    userEmail: { fontSize: 14, color: '#666' },
    statsCard: { backgroundColor: '#fff', marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    statItem: { alignItems: 'center', flex: 1 },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32' },
    statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
    statDivider: { height: 40, width: 1 },
    card: { marginBottom: 16, backgroundColor: '#fff' },
    cardTitle: { fontSize: 18, marginBottom: 12 },
    progressBar: { height: 10, borderRadius: 5, marginBottom: 8 },
    progressText: { fontSize: 14, color: '#666', textAlign: 'center' },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2E7D32',
    },
    volumeCard: { marginBottom: 12, backgroundColor: '#fff' },
    volumeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    volumeTitle: { fontSize: 14, fontWeight: 'bold', flex: 1, color: '#333' },
    volumePercentage: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
    volumeProgressText: { fontSize: 12, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 24 },
    // Estilos para el progreso general destacado
    generalProgressCard: {
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
        borderColor: '#2E7D32',
        marginBottom: 24,
    },
    generalProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    generalProgressTitle: {
        fontSize: 18,
        color: '#2E7D32',
        fontWeight: 'bold',
    },
    generalProgressPercentage: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    generalProgressBar: {
        height: 12,
        borderRadius: 6,
        backgroundColor: '#C8E6C9',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 24,
    },
    achievementsButton: {
        paddingVertical: 6,
    },
});