import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Dashboard as DashboardIcon,
  People,
  Analytics,
  Settings,
  Link as LinkIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import StatisticsOverview from './StatisticsOverview';
import TeamManagement from './TeamManagement';
import ChannelManagement from './ChannelManagement';
import AdminPanel from './AdminPanel';
import LinkManagement from './LinkManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.MEDIA_BUYER:
        return 'Медиа баер';
      case UserRole.TEAM_LEAD:
        return 'Тим-лид';
      case UserRole.OWNER:
        return 'Овнер/Админ';
      default:
        return role;
    }
  };

  const getAvailableTabs = () => {
    const tabs = [
      { label: 'Статистика', icon: <Analytics />, component: <StatisticsOverview /> }
    ];

    // Добавляем вкладку управления ссылками для всех ролей
    tabs.push({ label: 'Создать ссылку', icon: <LinkIcon />, component: <LinkManagement /> });

    if (user?.role === UserRole.TEAM_LEAD || user?.role === UserRole.OWNER) {
      tabs.push({ label: 'Команды', icon: <People />, component: <TeamManagement /> });
    }

    if (user?.role === UserRole.OWNER) {
      tabs.push({ label: 'Каналы', icon: <Settings />, component: <ChannelManagement /> });
      tabs.push({ label: 'Админ панель', icon: <DashboardIcon />, component: <AdminPanel /> });
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CRM Арбитраж - {getRoleDisplayName(user?.role || UserRole.MEDIA_BUYER)}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.name}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={logout}>
              <Logout sx={{ mr: 1 }} />
              Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          {availableTabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              id={`dashboard-tab-${index}`}
              aria-controls={`dashboard-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Box>

      {availableTabs.map((tab, index) => (
        <TabPanel key={index} value={tabValue} index={index}>
          {tab.component}
        </TabPanel>
      ))}
    </Box>
  );
};

export default Dashboard;


