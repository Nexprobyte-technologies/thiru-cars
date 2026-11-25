import React, { useEffect, useState } from 'react';
import { Save, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import { formatRelativeTime } from '../../lib/format.ts';
import type { UserAccount } from '../../../shared/types.ts';

interface ProfileForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
}

function formFromUser(user: UserAccount): ProfileForm {
  return {
    name: user.name,
    username: user.username || '',
    email: user.email,
    phone: user.phone || '',
    currentPassword: '',
    newPassword: '',
  };
}

export function AdminAccountPanel() {
  const { user, token, bootstrapStatus, setSession, pushToast } = useApp();
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    username: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const userId = user?.id;
  useEffect(() => {
    if (user) {
      setForm(formFromUser(user));
    }
  }, [userId]);

  if (!user) return null;

  const setField = (key: keyof ProfileForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiRequest<{ user: UserAccount; token: string }>('/api/auth/me', {
        method: 'PATCH',
        body: {
          name: form.name,
          username: form.username,
          email: form.email,
          phone: form.phone,
          currentPassword: form.currentPassword,
          ...(form.newPassword ? { newPassword: form.newPassword } : {}),
        },
        token,
      });
      setSession(res.user, res.token);
      setForm({ ...formFromUser(res.user), currentPassword: '', newPassword: '' });
      pushToast({ title: 'Account Updated', message: 'Your login details have been saved.', type: 'user' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to update account details';
      setError(message);
      pushToast({ title: 'Update Failed', message, type: 'system' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--site-bg)',
    borderColor: 'var(--site-border)',
    color: 'var(--site-text)',
  };

  return (
    <div className="space-y-5">
      <div
        className="flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{ backgroundColor: 'var(--site-surface)', borderColor: 'var(--site-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--site-accent)', color: 'var(--site-accent-contrast)' }}
          >
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-bold">{user.name}</p>
            <p className="text-xs" style={{ color: 'var(--site-muted)' }}>
              {user.role === 'admin' ? 'Administrator' : user.title || user.role} · {user.email}
              {user.staffCode ? ` · ${user.staffCode}` : ''}
            </p>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--site-muted)' }}>
          Last login: {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="max-w-3xl space-y-5 rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--site-surface)', borderColor: 'var(--site-border)' }}
      >
        <div>
          <h2 className="font-display text-base font-bold">Login & Contact Details</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--site-muted)' }}>
            Update your name, username, email, phone, or password. Your current password is only needed when setting a new password.
          </p>
          {error && (
            <p className="mt-2 text-xs" style={{ color: '#f87171' }} role="alert">
              {error}
            </p>
          )}
          {bootstrapStatus.envOverrideActive && user.role === 'admin' && (
            <p className="mt-2 text-xs" style={{ color: '#fbbf24' }}>
              ADMIN_PASSCODE is configured on the server, so that passcode still controls admin login.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--site-muted)' }}>Full Name</label>
            <input
              required
              minLength={2}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--site-muted)' }}>Username (Login ID)</label>
            <input
              required
              minLength={3}
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--site-muted)' }}>Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--site-muted)' }}>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--site-muted)' }}>Current Password (only when changing password)</label>
            <input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(e) => setField('currentPassword', e.target.value)}
              placeholder="Leave blank for email/phone changes"
              className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--site-muted)' }}>New Password (optional, 8+ chars)</label>
            <input
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(e) => setField('newPassword', e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ backgroundColor: 'var(--site-accent)', color: 'var(--site-accent-contrast)' }}
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : 'Save Account Details'}
        </button>
      </form>
    </div>
  );
}
