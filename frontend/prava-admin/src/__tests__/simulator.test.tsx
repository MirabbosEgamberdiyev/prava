import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import SimulatorAdminPage from '../page/Simulator';
import api from '../services/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: any) => (typeof defaultValue === 'string' ? defaultValue : key),
    i18n: { language: 'uzl' },
  }),
}));

describe('SimulatorAdminPage Component', () => {
  it('renders simulator KPI titles correctly', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: [] } });

    render(
      <MantineProvider>
        <BrowserRouter>
          <SimulatorAdminPage />
        </BrowserRouter>
      </MantineProvider>
    );

    expect(screen.getByText('Amaliy mashqlar')).toBeInTheDocument();
    expect(screen.getByText('Jarima qoidalari')).toBeInTheDocument();
    expect(screen.getByText('Avtomobil modellari')).toBeInTheDocument();
    expect(screen.getByText('Jami imtihonlar')).toBeInTheDocument();
  });

  it('renders official 12 autodrome exercises', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: [] } });

    render(
      <MantineProvider>
        <BrowserRouter>
          <SimulatorAdminPage />
        </BrowserRouter>
      </MantineProvider>
    );

    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Boshlang'ich hudud/i)).toBeInTheDocument();
  });
});
