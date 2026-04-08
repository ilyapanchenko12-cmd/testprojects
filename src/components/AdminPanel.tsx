import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper
} from '@mui/material';
import {
  People,
  Settings,
  Analytics,
  Security
} from '@mui/icons-material';

const AdminPanel: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Админ панель
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Пользователи
                  </Typography>
                  <Typography variant="h4" component="div">
                    3
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
              <Button size="small" sx={{ mt: 1 }}>
                Управление
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Настройки
                  </Typography>
                  <Typography variant="h4" component="div">
                    -
                  </Typography>
                </Box>
                <Settings color="secondary" sx={{ fontSize: 40 }} />
              </Box>
              <Button size="small" sx={{ mt: 1 }}>
                Настроить
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Аналитика
                  </Typography>
                  <Typography variant="h4" component="div">
                    -
                  </Typography>
                </Box>
                <Analytics color="success" sx={{ fontSize: 40 }} />
              </Box>
              <Button size="small" sx={{ mt: 1 }}>
                Просмотр
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Безопасность
                  </Typography>
                  <Typography variant="h4" component="div">
                    -
                  </Typography>
                </Box>
                <Security color="warning" sx={{ fontSize: 40 }} />
              </Box>
              <Button size="small" sx={{ mt: 1 }}>
                Настроить
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Системная информация
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" fontFamily="monospace">
              CRM System v1.0.0<br />
              React 18.2.0<br />
              Material-UI 5.14.0<br />
              TypeScript 4.9.0
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminPanel;