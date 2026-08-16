import React from 'react';
import { VaultProvider, useVault } from './state/vaultContext';
import { TopNavBar } from './components/common/TopNavBar';
import { SideNavBar } from './components/common/SideNavBar';
import { LandingView } from './components/views/LandingView';
import { DashboardView } from './components/views/DashboardView';
import { DepositShieldView } from './components/views/DepositShieldView';
import { PolicyConfigView } from './components/views/PolicyConfigView';
import { TransferProofView } from './components/views/TransferProofView';
import { AuditComplianceView } from './components/views/AuditComplianceView';
import './styles/design-system.css';

const MainLayout: React.FC = () => {
  const { activeTab } = useVault();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>
      <TopNavBar />

      {activeTab === 'landing' ? (
        <main style={{ flex: 1 }}>
          <LandingView />
        </main>
      ) : (
        <div style={{ display: 'flex', flex: 1 }}>
          <SideNavBar />
          <main style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0, overflowY: 'auto' }}>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'deposit' && <DepositShieldView />}
            {activeTab === 'policy' && <PolicyConfigView />}
            {activeTab === 'transfer' && <TransferProofView />}
            {activeTab === 'audit' && <AuditComplianceView />}
          </main>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <VaultProvider>
      <MainLayout />
    </VaultProvider>
  );
};

export default App;
