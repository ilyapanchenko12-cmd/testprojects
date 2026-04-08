import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Add,
  List,
  Settings,
  Bot
} from '@mui/icons-material';
import { AdLink } from '../types';
import { demoAdLinks } from '../data/demoData';
import CreateLink from './CreateLink';
import LinksList from './LinksList';
import PixelManagement from './PixelManagement';
import BotManagement from './BotManagement';

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
      id={`link-management-tabpanel-${index}`}
      aria-labelledby={`link-management-tab-${index}`}
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

const LinkManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [links, setLinks] = useState<AdLink[]>(demoAdLinks);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLinkCreated = (newLink: AdLink) => {
    setLinks([...links, newLink]);
  };

  const handleLinkUpdate = (updatedLink: AdLink) => {
    setLinks(links.map(link => 
      link.id === updatedLink.id ? updatedLink : link
    ));
  };

  return (
    <Box>
      <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="link management tabs">
          <Tab
            icon={<Add />}
            label="Создать ссылку"
            id="link-management-tab-0"
            aria-controls="link-management-tabpanel-0"
          />
          <Tab
            icon={<List />}
            label="Список ссылок"
            id="link-management-tab-1"
            aria-controls="link-management-tabpanel-1"
          />
          <Tab
            icon={<Settings />}
            label="Пиксели"
            id="link-management-tab-2"
            aria-controls="link-management-tabpanel-2"
          />
          <Tab
            icon={<Bot />}
            label="Боты"
            id="link-management-tab-3"
            aria-controls="link-management-tabpanel-3"
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <CreateLink onLinkCreated={handleLinkCreated} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <LinksList links={links} onLinkUpdate={handleLinkUpdate} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <PixelManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <BotManagement />
      </TabPanel>
    </Box>
  );
};

export default LinkManagement;

