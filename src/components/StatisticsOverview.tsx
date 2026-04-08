import React from 'react';
import {
  Box,
  Grid,
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
  Chip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney
} from '@mui/icons-material';
import { demoStatistics, demoChannels } from '../data/demoData';

const StatisticsOverview: React.FC = () => {
  const totalLeads = demoStatistics.reduce((sum, stat) => sum + stat.leadsCount, 0);
  const totalUnsubscribes = demoStatistics.reduce((sum, stat) => sum + stat.unsubscribes, 0);
  const totalSpend = demoStatistics.reduce((sum, stat) => sum + stat.spend, 0);
  const totalRevenue = demoStatistics.reduce((sum, stat) => sum + (stat.revenue || 0), 0);
  const unsubscribeRate = totalLeads > 0 ? ((totalUnsubscribes / totalLeads) * 100).toFixed(1) : '0';

  const getChannelName = (channelId?: string) => {
    if (!channelId) return 'Неизвестный канал';
    const channel = demoChannels.find(c => c.id === channelId);
    return channel?.name || 'Неизвестный канал';
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'FB_PURCHASE': return 'primary';
      case 'TG_PURCHASE': return 'secondary';
      case 'UBT': return 'success';
      case 'INFLUENCE': return 'warning';
      case 'MOTIVE': return 'info';
      case 'ADVERTISING': return 'error';
      default: return 'default';
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'FB_PURCHASE': return 'FB Закуп';
      case 'TG_PURCHASE': return 'TG Закуп';
      case 'UBT': return 'UBT';
      case 'INFLUENCE': return 'Инфлюенс';
      case 'MOTIVE': return 'Мотив';
      case 'ADVERTISING': return 'Реклама';
      default: return direction;
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Общая статистика
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Всего заявок
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalLeads.toLocaleString()}
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Отписки
                  </Typography>
                  <Typography variant="h4" component="div" color="error">
                    {totalUnsubscribes.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingDown color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Потрачено
                  </Typography>
                  <Typography variant="h4" component="div">
                    ${totalSpend.toLocaleString()}
                  </Typography>
                </Box>
                <AttachMoney color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Выручка
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    ${totalRevenue.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Детальная статистика по направлениям
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Канал</TableCell>
                  <TableCell>Направление</TableCell>
                  <TableCell align="right">Заявки</TableCell>
                  <TableCell align="right">Отписки</TableCell>
                  <TableCell align="right">% отписок</TableCell>
                  <TableCell align="right">Потрачено</TableCell>
                  <TableCell align="right">Выручка</TableCell>
                  <TableCell align="right">ROI</TableCell>
                  <TableCell>Дата</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demoStatistics.map((stat) => {
                  const roi = stat.spend > 0 ? (((stat.revenue || 0) - stat.spend) / stat.spend * 100).toFixed(1) : '0';
                  const unsubscribeRate = stat.leadsCount > 0 ? ((stat.unsubscribes / stat.leadsCount) * 100).toFixed(1) : '0';
                  
                  return (
                    <TableRow key={stat.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {getChannelName(stat.channelId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getDirectionLabel(stat.direction)}
                          color={getDirectionColor(stat.direction)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {stat.leadsCount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color="error">
                          {stat.unsubscribes.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={parseFloat(unsubscribeRate) > 10 ? 'error' : 'success'}
                        >
                          {unsubscribeRate}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          ${stat.spend.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          ${(stat.revenue || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={parseFloat(roi) > 0 ? 'success' : 'error'}
                        >
                          {roi}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {stat.date.toLocaleDateString('ru-RU')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StatisticsOverview;

