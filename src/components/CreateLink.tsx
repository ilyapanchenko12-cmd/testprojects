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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  Add,
  Link as LinkIcon,
  Campaign,
  Channel
} from '@mui/icons-material';
import { AdLink, LinkType, Pixel, TelegramBot, TelegramChannel } from '../types';
import { demoPixels, demoBots, demoChannels } from '../data/demoData';

interface CreateLinkProps {
  onLinkCreated: (link: AdLink) => void;
}

const CreateLink: React.FC<CreateLinkProps> = ({ onLinkCreated }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: LinkType.AD_LINK,
    pixelId: '',
    botId: '',
    channelId: ''
  });

  const handleOpen = () => {
    setFormData({
      name: '',
      type: LinkType.AD_LINK,
      pixelId: '',
      botId: '',
      channelId: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: '',
      type: LinkType.AD_LINK,
      pixelId: '',
      botId: '',
      channelId: ''
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.pixelId || !formData.botId) {
      return;
    }

    if (formData.type === LinkType.CHANNEL_LINK && !formData.channelId) {
      return;
    }

    const selectedBot = demoBots.find(b => b.id === formData.botId);
    const selectedChannel = formData.channelId ? demoChannels.find(c => c.id === formData.channelId) : null;
    
    const generateUrl = () => {
      if (formData.type === LinkType.AD_LINK) {
        return `https://t.me/${selectedBot?.username.replace('@', '')}?start=ad_${formData.name.toLowerCase().replace(/\s+/g, '_')}`;
      } else {
        return `https://t.me/${selectedBot?.username.replace('@', '')}?start=channel_${selectedChannel?.username.replace('@', '')}`;
      }
    };

    const newLink: AdLink = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      pixelId: formData.pixelId,
      botId: formData.botId,
      channelId: formData.channelId || undefined,
      buyerId: '2', // В реальном приложении брать из контекста
      url: generateUrl(),
      leadsCount: 0,
      unsubscribes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onLinkCreated(newLink);
    handleClose();
  };

  const selectedPixel = demoPixels.find(p => p.id === formData.pixelId);
  const selectedBot = demoBots.find(b => b.id === formData.botId);
  const selectedChannel = formData.channelId ? demoChannels.find(c => c.id === formData.channelId) : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Создание рекламной ссылки
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
        >
          Создать ссылку
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" paragraph>
            Создавайте рекламные ссылки для отслеживания эффективности ваших кампаний. 
            Выберите пиксель для аналитики, бота для обработки лидов и при необходимости канал для продвижения.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Chip 
              icon={<Campaign />} 
              label="Ссылки для залива рекламы" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              icon={<Channel />} 
              label="Ссылки на каналы" 
              color="secondary" 
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Создать рекламную ссылку
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Название ссылки"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="Крипто залив - Январь"
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">Тип ссылки</FormLabel>
              <RadioGroup
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as LinkType })}
                row
              >
                <FormControlLabel 
                  value={LinkType.AD_LINK} 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Campaign />
                      <span>Ссылка для залива рекламы</span>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value={LinkType.CHANNEL_LINK} 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Channel />
                      <span>Ссылка на канал</span>
                    </Box>
                  } 
                />
              </RadioGroup>
            </FormControl>

            <Divider />

            <FormControl fullWidth required>
              <InputLabel>Пиксель</InputLabel>
              <Select
                value={formData.pixelId}
                onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
                label="Пиксель"
              >
                {demoPixels.map((pixel) => (
                  <MenuItem key={pixel.id} value={pixel.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {pixel.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {pixel.pixelId}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Telegram бот</InputLabel>
              <Select
                value={formData.botId}
                onChange={(e) => setFormData({ ...formData, botId: e.target.value })}
                label="Telegram бот"
              >
                {demoBots.map((bot) => (
                  <MenuItem key={bot.id} value={bot.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {bot.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bot.username}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.type === LinkType.CHANNEL_LINK && (
              <FormControl fullWidth required>
                <InputLabel>Канал</InputLabel>
                <Select
                  value={formData.channelId}
                  onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                  label="Канал"
                >
                  {demoChannels.map((channel) => (
                    <MenuItem key={channel.id} value={channel.id}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {channel.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {channel.username} • {channel.subscribers.toLocaleString()} подписчиков
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {formData.pixelId && formData.botId && (
              <Alert severity="success">
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Предварительный просмотр ссылки:
                </Typography>
                <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                  {formData.type === LinkType.AD_LINK 
                    ? `https://t.me/${selectedBot?.username.replace('@', '')}?start=ad_${formData.name.toLowerCase().replace(/\s+/g, '_')}`
                    : `https://t.me/${selectedBot?.username.replace('@', '')}?start=channel_${selectedChannel?.username.replace('@', '')}`
                  }
                </Typography>
              </Alert>
            )}

            <Alert severity="info">
              После создания ссылки вы сможете отслеживать количество заявок, отписок и процент конверсии по каждой ссылке.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name || !formData.pixelId || !formData.botId || (formData.type === LinkType.CHANNEL_LINK && !formData.channelId)}
          >
            Создать ссылку
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateLink;

