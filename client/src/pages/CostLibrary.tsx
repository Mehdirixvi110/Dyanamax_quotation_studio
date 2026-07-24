import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { ItemsTab } from './cost-library/ItemsTab';
import { CategoriesTab } from './cost-library/CategoriesTab';
import { RateTiersTab } from './cost-library/RateTiersTab';
import { UnitsTab } from './cost-library/UnitsTab';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export function CostLibraryPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <PageHeader
        title="Cost Library"
        subtitle="Manage items, categories, rate tiers, and units"
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="Cost Library tabs"
        >
          <Tab label="Items" />
          <Tab label="Categories" />
          <Tab label="Rate Tiers" />
          <Tab label="Units" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <ItemsTab />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <CategoriesTab />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <RateTiersTab />
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        <UnitsTab />
      </TabPanel>
    </Box>
  );
}
