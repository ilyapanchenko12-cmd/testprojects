import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData, UserRole } from '../types';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    role: UserRole.MEDIA_BUYER
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const { register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    const success = await register(formData);
    if (success) {
      setSuccess(true);
    } else {
      setError('Ошибка при регистрации');
    }
  };

  const handleChange = (field: keyof RegisterData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (success) {
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
            <Alert severity="success" sx={{ mb: 2 }}>
              Регистрация успешна! Вы будете перенаправлены на главную страницу.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
            Регистрация
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Создайте новый аккаунт
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Имя"
              value={formData.name}
              onChange={handleChange('name')}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              margin="normal"
              required
              disabled={loading}
            />
            <FormControl fullWidth margin="normal" disabled={loading}>
              <InputLabel>Роль</InputLabel>
              <Select
                value={formData.role}
                onChange={handleChange('role')}
                label="Роль"
              >
                <MenuItem value={UserRole.MEDIA_BUYER}>Медиа баер</MenuItem>
                <MenuItem value={UserRole.TEAM_LEAD}>Тим-лид</MenuItem>
                <MenuItem value={UserRole.OWNER}>Овнер/Админ</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterForm;


