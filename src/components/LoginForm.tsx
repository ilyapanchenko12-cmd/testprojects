import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../types';

const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(credentials);
    if (!success) {
      setError('Неверный email или пароль');
    }
  };

  const handleChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Card sx={{ width: 400, p: 3 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            CRM Арбитраж
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Войдите в систему
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={credentials.email}
              onChange={handleChange('email')}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={credentials.password}
              onChange={handleChange('password')}
              margin="normal"
              required
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Войти'}
            </Button>
          </form>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              Тестовые доступы:
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              <strong>Админ:</strong> admin@example.com / admin123
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              <strong>Баер:</strong> buyer@example.com / buyer123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;


