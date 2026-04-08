import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { Pixel } from '../types';
import { demoPixels } from '../data/demoData';

const PixelManagement: React.FC = () => {
  const [pixels, setPixels] = useState<Pixel[]>(demoPixels);
  const [open, setOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<Pixel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pixelId: '',
    token: ''
  });
  const [showToken, setShowToken] = useState<{ [key: string]: boolean }>({});

  const handleOpen = (pixel?: Pixel) => {
    if (pixel) {
      setEditingPixel(pixel);
      setFormData({
        name: pixel.name,
        pixelId: pixel.pixelId,
        token: pixel.token
      });
    } else {
      setEditingPixel(null);
      setFormData({
        name: '',
        pixelId: '',
        token: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPixel(null);
    setFormData({
      name: '',
      pixelId: '',
      token: ''
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.pixelId || !formData.token) {
      return;
    }

    if (editingPixel) {
      setPixels(pixels.map(p => 
        p.id === editingPixel.id 
          ? { ...p, ...formData, updatedAt: new Date() }
          : p
      ));
    } else {
      const newPixel: Pixel = {
        id: Date.now().toString(),
        name: formData.name,
        pixelId: formData.pixelId,
        token: formData.token,
        buyerId: '2', // В реальном приложении брать из контекста
        createdAt: new Date()
      };
      setPixels([...pixels, newPixel]);
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    setPixels(pixels.filter(p => p.id !== id));
  };

  const toggleTokenVisibility = (id: string) => {
    setShowToken(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return '••••••••';
    return token.substring(0, 4) + '••••••••' + token.substring(token.length - 4);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Управление пикселями
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Добавить пиксель
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>ID пикселя</TableCell>
                  <TableCell>Токен</TableCell>
                  <TableCell>Дата создания</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pixels.map((pixel) => (
                  <TableRow key={pixel.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {pixel.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={pixel.pixelId} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontFamily="monospace">
                          {showToken[pixel.id] ? pixel.token : maskToken(pixel.token)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => toggleTokenVisibility(pixel.id)}
                        >
                          {showToken[pixel.id] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {pixel.createdAt.toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(pixel)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(pixel.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPixel ? 'Редактировать пиксель' : 'Добавить пиксель'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Название пикселя"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="ID пикселя"
              value={formData.pixelId}
              onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
              fullWidth
              required
              placeholder="123456789012345"
            />
            <TextField
              label="Токен доступа"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              fullWidth
              required
              multiline
              rows={3}
              placeholder="EAABwzLixnjYBO..."
            />
            <Alert severity="info">
              Токен будет замаскирован в списке для безопасности
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name || !formData.pixelId || !formData.token}
          >
            {editingPixel ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PixelManagement;

