import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  FilterList,
  ContentCopy,
  Campaign,
  Channel,
  TrendingUp,
  TrendingDown,
  Visibility
} from '@mui/icons-material';
import { AdLink, LinkType, Pixel, TelegramBot, TelegramChannel } from '../types';
import { demoAdLinks, demoPixels, demoBots, demoChannels } from '../data/demoData';

interface LinksListProps {
  links: AdLink[];
  onLinkUpdate: (link: AdLink) => void;
}

const LinksList: React.FC<LinksListProps> = ({ links, onLinkUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<LinkType | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [selectedLink, setSelectedLink] = useState<AdLink | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const matchesSearch = link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || link.type === typeFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'ALL') {
        const linkDate = new Date(link.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'TODAY':
            matchesDate = linkDate.toDateString() === now.toDateString();
            break;
          case 'WEEK':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = linkDate >= weekAgo;
            break;
          case 'MONTH':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = linkDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesType && matchesDate;
    });
  }, [links, searchTerm, typeFilter, dateFilter]);

  const getPixelName = (pixelId: string) => {
    const pixel = demoPixels.find(p => p.id === pixelId);
    return pixel?.name || 'Неизвестный пиксель';
  };

  const getBotName = (botId: string) => {
    const bot = demoBots.find(b => b.id === botId);
    return bot?.name || 'Неизвестный бот';
  };

  const getChannelName = (channelId?: string) => {
    if (!channelId) return 'Не указан';
    const channel = demoChannels.find(c => c.id === channelId);
    return channel?.name || 'Неизвестный канал';
  };

  const getUnsubscribePercentage = (leads: number, unsubscribes: number) => {
    if (leads === 0) return 0;
    return ((unsubscribes / leads) * 100).toFixed(1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleViewDetails = (link: AdLink) => {
    setSelectedLink(link);
    setDetailsOpen(true);
  };

  const getTypeIcon = (type: LinkType) => {
    return type === LinkType.AD_LINK ? <Campaign /> : <Channel />;
  };

  const getTypeColor = (type: LinkType) => {
    return type === LinkType.AD_LINK ? 'primary' : 'secondary';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Список рекламных ссылок
        </Typography>
        <Chip 
          icon={<FilterList />} 
          label={`${filteredLinks.length} из ${links.length}`} 
          color="primary" 
          variant="outlined"
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Поиск по названию или URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Тип ссылки</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as LinkType | 'ALL')}
                  label="Тип ссылки"
                >
                  <MenuItem value="ALL">Все типы</MenuItem>
                  <MenuItem value={LinkType.AD_LINK}>Залив рекламы</MenuItem>
                  <MenuItem value={LinkType.CHANNEL_LINK}>Ссылка на канал</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Период</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  label="Период"
                >
                  <MenuItem value="ALL">Все время</MenuItem>
                  <MenuItem value="TODAY">Сегодня</MenuItem>
                  <MenuItem value="WEEK">За неделю</MenuItem>
                  <MenuItem value="MONTH">За месяц</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('ALL');
                  setDateFilter('ALL');
                }}
              >
                Сбросить
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Пиксель</TableCell>
                  <TableCell>Бот</TableCell>
                  <TableCell>Канал</TableCell>
                  <TableCell align="right">Заявки</TableCell>
                  <TableCell align="right">Отписки</TableCell>
                  <TableCell align="right">% отписок</TableCell>
                  <TableCell>Дата создания</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLinks.map((link) => (
                  <TableRow key={link.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {link.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(link.type)}
                        label={link.type === LinkType.AD_LINK ? 'Залив' : 'Канал'}
                        color={getTypeColor(link.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 200 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {link.url}
                        </Typography>
                        <Tooltip title="Копировать URL">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(link.url)}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getPixelName(link.pixelId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getBotName(link.botId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getChannelName(link.channelId)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        {link.leadsCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="error">
                        {link.unsubscribes}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {link.unsubscribes > link.leadsCount * 0.1 ? (
                          <TrendingUp color="error" fontSize="small" />
                        ) : (
                          <TrendingDown color="success" fontSize="small" />
                        )}
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={link.unsubscribes > link.leadsCount * 0.1 ? 'error' : 'success'}
                        >
                          {getUnsubscribePercentage(link.leadsCount, link.unsubscribes)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {link.createdAt.toLocaleDateString('ru-RU')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Подробнее">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(link)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Детали ссылки: {selectedLink?.name}
        </DialogTitle>
        <DialogContent>
          {selectedLink && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  URL ссылки:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="body2" fontFamily="monospace" sx={{ flex: 1, wordBreak: 'break-all' }}>
                    {selectedLink.url}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(selectedLink.url)}
                  >
                    <ContentCopy />
                  </IconButton>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Статистика:
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary.contrastText">
                        {selectedLink.leadsCount}
                      </Typography>
                      <Typography variant="body2" color="primary.contrastText">
                        Заявок
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="error.contrastText">
                        {selectedLink.unsubscribes}
                      </Typography>
                      <Typography variant="body2" color="error.contrastText">
                        Отписок
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="secondary.contrastText">
                        {getUnsubscribePercentage(selectedLink.leadsCount, selectedLink.unsubscribes)}%
                      </Typography>
                      <Typography variant="body2" color="secondary.contrastText">
                        % отписок
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Настройки:
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Пиксель:</strong> {getPixelName(selectedLink.pixelId)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Бот:</strong> {getBotName(selectedLink.botId)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Канал:</strong> {getChannelName(selectedLink.channelId)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Создана:</strong> {selectedLink.createdAt.toLocaleString('ru-RU')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Обновлена:</strong> {selectedLink.updatedAt.toLocaleString('ru-RU')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LinksList;

