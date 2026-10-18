import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import NotFoundPage from '../page/NotFound';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: { language: 'uzl' },
  }),
}));

describe('NotFoundPage Component', () => {
  it('renders 404 heading and title correctly', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <NotFoundPage />
        </BrowserRouter>
      </MantineProvider>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Sahifa topilmadi')).toBeInTheDocument();
  });

  it('renders navigation buttons to go back and home', () => {
    render(
      <MantineProvider>
        <BrowserRouter>
          <NotFoundPage />
        </BrowserRouter>
      </MantineProvider>
    );

    expect(screen.getByText('Orqaga qaytish')).toBeInTheDocument();
    expect(screen.getByText("Bosh sahifaga o'tish")).toBeInTheDocument();
  });
});
