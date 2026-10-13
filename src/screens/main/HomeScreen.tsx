// src/screens/main/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Volume } from '../../types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  
  const { user, signOut } = useAuth();
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolumes();
  }, []);

  const fetchVolumes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('volumes')
      .select('*')
      .eq('is_published', true)
      .order('order_number', { ascending: true });

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los volúmenes.');
      console.error(error);
    } else {
      setVolumes(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 16 }}>Cargando contenido...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>¡Hola!</Title>
        <View style={{ flexDirection: 'row' }}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Profile')}
            textColor="#fff"
          >
            Perfil
          </Button>
          <Button mode="text" onPress={handleSignOut} textColor="#fff">
            Salir
          </Button>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Volúmenes Disponibles</Text>

      <FlatList
        data={volumes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>
                Vol. {item.order_number}: {item.title}
              </Title>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() =>
                  navigation.navigate('VolumeDetail', {
                    volumeId: item.id,
                    volumeTitle: `Vol. ${item.order_number}: ${item.title}`,
                  })
                }
              >
                Comenzar
              </Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay volúmenes publicados aún.</Text>
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
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', padding: 16, color: '#333' },
  card: { marginHorizontal: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16 },
  cardDescription: { color: '#666' },
  emptyText: { textAlign: 'center', marginTop: 32, color: '#999' },
});