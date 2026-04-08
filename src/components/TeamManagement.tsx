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
  People
} from '@mui/icons-material';
import { demoT teams } from '../data/demoData';

const TeamManagement: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Управление командами
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
        >
          Создать команду
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название команды</TableCell>
                  <TableCell>Тим-лид</TableCell>
                  <TableCell>Участники</TableCell>
                  <TableCell>Дата создания</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demoT teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {team.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Мария Тимлид" 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People color="action" />
                        <Typography variant="body2">
                          {team.members.length} участников
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {team.createdAt.toLocaleDateString('ru-RU')}
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

export default TeamManagement;

