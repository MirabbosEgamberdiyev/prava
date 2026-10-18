import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import RoleGuard from '../hooks/auth/RoleGuard';
import * as AuthContextModule from '../hooks/auth/AuthContext';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uzl' },
  }),
}));

describe('RoleGuard RBAC Protection', () => {
  it('renders children when user role is allowed', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, role: 'SUPER_ADMIN' },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <div data-testid="protected-content">Secret Admin Area</div>
          </RoleGuard>
        </BrowserRouter>
      </MantineProvider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Secret Admin Area')).toBeInTheDocument();
  });

  it('blocks access and displays noPermission when user role is unauthorized', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: { id: 2, role: 'USER' },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MantineProvider>
        <BrowserRouter>
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <div data-testid="protected-content">Secret Admin Area</div>
          </RoleGuard>
        </BrowserRouter>
      </MantineProvider>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('common.noPermission')).toBeInTheDocument();
  });
});
