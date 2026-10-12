// src/screens/auth/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);
    if (error) {
      Alert.alert('Error al registrarse', error.message);
    } else {
      Alert.alert('¡Éxito!', 'Revisa tu correo para confirmar tu cuenta.');
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Crear Cuenta</Title>

      <TextInput
        label="Nombre de usuario"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Registrarse
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={styles.linkButton}
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, textAlign: 'center', marginBottom: 32, color: '#2E7D32' },
  input: { marginBottom: 16 },
  button: { marginTop: 16, paddingVertical: 6 },
  linkButton: { marginTop: 8 },
});