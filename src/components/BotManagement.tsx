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
  VisibilityOff,
  Telegram
} from '@mui/icons-material';
import { TelegramBot } from '../types';
import { demoBots } from '../data/demoData';

const BotManagement: React.FC = () => {
  const [bots, setBots] = useState<TelegramBot[]>(demoBots);
  const [open, setOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<TelegramBot | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    botToken: '',
    username: ''
  });
  const [showToken, setShowToken] = useState<{ [key: string]: boolean }>({});

  const handleOpen = (bot?: TelegramBot) => {
    if (bot) {
      setEditingBot(bot);
      setFormData({
        name: bot.name,
        botToken: bot.botToken,
        username: bot.username
      });
    } else {
      setEditingBot(null);
      setFormData({
        name: '',
        botToken: '',
        username: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBot(null);
    setFormData({
      name: '',
      botToken: '',
      username: ''
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.botToken || !formData.username) {
      return;
    }

    if (editingBot) {
      setBots(bots.map(b => 
        b.id === editingBot.id 
          ? { ...b, ...formData, updatedAt: new Date() }
          : b
      ));
    } else {
      const newBot: TelegramBot = {
        id: Date.now().toString(),
        name: formData.name,
        botToken: formData.botToken,
        username: formData.username,
        buyerId: '2', // В реальном приложении брать из контекста
        createdAt: new Date()
      };
      setBots([...bots, newBot]);
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    setBots(bots.filter(b => b.id !== id));
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
          Управление ботами
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Добавить бота
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Токен бота</TableCell>
                  <TableCell>Дата создания</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Telegram color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {bot.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={bot.username} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontFamily="monospace">
                          {showToken[bot.id] ? bot.botToken : maskToken(bot.botToken)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => toggleTokenVisibility(bot.id)}
                        >
                          {showToken[bot.id] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {bot.createdAt.toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(bot)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(bot.id)}
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
          {editingBot ? 'Редактировать бота' : 'Добавить бота'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Название бота"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="Крипто Бот"
            />
            <TextField
              label="Username бота"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
              required
              placeholder="@crypto_lead_bot"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>@</Typography>
              }}
            />
            <TextField
              label="Токен бота"
              value={formData.botToken}
              onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
              fullWidth
              required
              multiline
              rows={3}
              placeholder="1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
            />
            <Alert severity="info">
              Токен будет замаскирован в списке для безопасности. Получить токен можно у @BotFather в Telegram
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name || !formData.botToken || !formData.username}
          >
            {editingBot ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BotManagement;

