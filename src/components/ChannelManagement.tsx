import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Telegram
} from '@mui/icons-material';
import { demoChannels } from '../data/demoData';

const ChannelManagement: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Управление каналами
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
        >
          Добавить канал
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название канала</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Подписчики</TableCell>
                  <TableCell>Дата добавления</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demoChannels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Telegram color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {channel.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={channel.username} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {channel.subscribers.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {channel.addedAt.toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
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
    </Box>
  );
};

export default ChannelManagement;

