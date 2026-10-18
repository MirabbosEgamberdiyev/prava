import { describe, it, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import { getAccessToken, saveTokens, clearTokens } from '../services/api';

describe('Authentication & Token Lifecycle', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('correctly saves and retrieves access token', () => {
    expect(getAccessToken()).toBeUndefined();
    saveTokens('test-access-token-xyz', 'refresh-token', { id: 1, role: 'ADMIN' });
    expect(getAccessToken()).toBe('test-access-token-xyz');
  });

  it('saves user data in cookie as JSON string', () => {
    const userPayload = { id: 42, role: 'SUPER_ADMIN', fullName: 'Test Admin' };
    saveTokens('access-123', undefined, userPayload);
    const storedUser = Cookies.get('prava_admin_user');
    expect(storedUser).toBeDefined();
    expect(JSON.parse(storedUser!)).toEqual(userPayload);
  });

  it('clears all admin tokens and user data on logout', () => {
    saveTokens('access-token-to-clear', 'refresh-token', { role: 'ADMIN' });
    expect(getAccessToken()).toBe('access-token-to-clear');

    clearTokens();
    expect(getAccessToken()).toBeUndefined();
    expect(Cookies.get('prava_admin_user')).toBeUndefined();
    expect(Cookies.get('prava_admin_rt_legacy')).toBeUndefined();
  });
});
