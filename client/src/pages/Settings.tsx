import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { CompanyInfoTab } from './settings/CompanyInfoTab';
import { CurrenciesTab } from './settings/CurrenciesTab';
import { DefaultsTab } from './settings/DefaultsTab';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage company details and preferences"
      />

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Company Info" />
        <Tab label="Currencies" />
        <Tab label="Defaults" />
      </Tabs>

      {activeTab === 0 && <CompanyInfoTab />}
      {activeTab === 1 && <CurrenciesTab />}
      {activeTab === 2 && <DefaultsTab />}
    </Box>
  );
}
