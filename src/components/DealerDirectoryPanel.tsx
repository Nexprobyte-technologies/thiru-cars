import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import type { DealerContact, DealerContactKind } from '../../shared/types.ts';

const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const createEmptyForm = () => ({ name: '', location: '', phone: '', date: todayIso() });

const DIRECTORY_CONFIG: Record<
  DealerContactKind,
  { title: string; nameLabel: string; locationLabel?: string; phoneLabel: string; dateLabel: string; addLabel: string }
> = {
  purchase: {
    title: 'Purchasing Dealers',
    nameLabel: 'DEALER FOR PURCHASE',
    phoneLabel: 'PHONE NUMBERS',
    dateLabel: 'DATE',
    addLabel: 'Add Purchase Dealer',
  },
  catalog: {
    title: 'Dealers Catlogs',
    nameLabel: 'DEALERS CATLOGS',
    locationLabel: 'LOCATION',
    phoneLabel: 'PHONE NUMBERS',
    dateLabel: 'DATE',
    addLabel: 'Add Dealers Catlog',
  },
  trichy: {
    title: 'Trichy Dealers',
    nameLabel: 'DEALERS NAME',
    phoneLabel: 'PHONE NUMBER',
    dateLabel: 'DATE',
    addLabel: 'Add Trichy Dealer',
  },
};

export function DealerDirectoryPanel({ kind }: { kind: DealerContactKind }) {
  const { dealerContacts, token, user, pushToast, refreshProtected } = useApp();
  const config = DIRECTORY_CONFIG[kind];
  const isAdmin = user?.role === 'admin';
  const canAdd = isAdmin || Boolean(user?.permissions.canAddCar);
  const canEdit = isAdmin || Boolean(user?.permissions.canEditCar);
  const canDelete = isAdmin || Boolean(user?.permissions.canDeleteCar);

  const [query, setQuery] = useState('');
  const [form, setForm] = useState(createEmptyForm);
  const [editing, setEditing] = useState<DealerContact | null>(null);
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dealerContacts.filter((contact) => {
      if (contact.kind !== kind) return false;
      if (!q) return true;
      return `${contact.name} ${contact.location} ${contact.phone} ${contact.date || ''}`.toLowerCase().includes(q);
    });
  }, [dealerContacts, kind, query]);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditing(null);
  };

  const startEdit = (contact: DealerContact) => {
    setEditing(contact);
    setForm({ name: contact.name, location: contact.location, phone: contact.phone, date: contact.date || todayIso() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/api/dealer-contacts/${editing.id}`, {
          method: 'PATCH',
          body: form,
          token,
        });
        pushToast({ title: 'Dealer Updated', message: `${form.name} was saved.`, type: 'inventory' });
      } else {
        await apiRequest('/api/dealer-contacts', {
          method: 'POST',
          body: { ...form, kind },
          token,
        });
        pushToast({ title: 'Dealer Added', message: `${form.name} was added to ${config.title}.`, type: 'inventory' });
      }
      resetForm();
      await refreshProtected();
    } catch (err: unknown) {
      pushToast({
        title: 'Save Failed',
        message: err instanceof Error ? err.message : 'Unable to save dealer contact',
        type: 'system',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact: DealerContact) => {
    if (!token) return;
    if (!window.confirm(`Delete ${contact.name} from ${config.title}? This cannot be undone.`)) return;
    try {
      await apiRequest(`/api/dealer-contacts/${contact.id}`, { method: 'DELETE', token });
      if (editing?.id === contact.id) resetForm();
      await refreshProtected();
      pushToast({ title: 'Dealer Deleted', message: `${contact.name} was removed.`, type: 'inventory' });
    } catch (err: unknown) {
      pushToast({
        title: 'Delete Failed',
        message: err instanceof Error ? err.message : 'Unable to delete dealer contact',
        type: 'system',
      });
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--site-muted)' }}>
            {config.nameLabel}
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={config.nameLabel}
            className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
            style={{ backgroundColor: 'var(--site-bg)', borderColor: 'var(--site-border)' }}
          />
        </div>
        {config.locationLabel && (
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--site-muted)' }}>
              {config.locationLabel}
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder={config.locationLabel}
              className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
              style={{ backgroundColor: 'var(--site-bg)', borderColor: 'var(--site-border)' }}
            />
          </div>
        )}
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--site-muted)' }}>
            {config.phoneLabel}
          </label>
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={config.phoneLabel}
            className="w-full rounded-xl border px-3 py-2 text-xs outline-none font-mono-tabular"
            style={{ backgroundColor: 'var(--site-bg)', borderColor: 'var(--site-border)' }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--site-muted)' }}>
            {config.dateLabel}
          </label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-xl border px-3 py-2 text-xs outline-none font-mono-tabular"
            style={{ backgroundColor: 'var(--site-bg)', borderColor: 'var(--site-border)' }}
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving || (editing ? !canEdit : !canAdd)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--site-accent)', color: 'var(--site-accent-contrast)' }}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span>{saving ? 'Saving…' : editing ? 'Update' : config.addLabel}</span>
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: 'var(--site-border)', color: 'var(--site-muted)' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--site-muted)' }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${config.title}…`}
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none"
            style={{ backgroundColor: 'var(--site-bg)', borderColor: 'var(--site-border)' }}
          />
        </label>
      </div>

      <div
        className="overflow-x-auto rounded-2xl border"
        style={{ backgroundColor: 'var(--site-surface)', borderColor: 'var(--site-border)' }}
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--site-border)', color: 'var(--site-muted)' }}>
              <th className="px-4 py-3 font-medium">{config.nameLabel}</th>
              {config.locationLabel && <th className="px-4 py-3 font-medium">{config.locationLabel}</th>}
              <th className="px-4 py-3 font-medium">{config.phoneLabel}</th>
              <th className="px-4 py-3 font-medium">{config.dateLabel}</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--site-border)' }}>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center"
                  colSpan={config.locationLabel ? 5 : 4}
                  style={{ color: 'var(--site-muted)' }}
                >
                  No {config.title.toLowerCase()} found.
                </td>
              </tr>
            ) : (
              rows.map((contact) => (
                <tr key={contact.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold">{contact.name}</td>
                  {config.locationLabel && (
                    <td className="px-4 py-3" style={{ color: 'var(--site-muted)' }}>
                      {contact.location || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 font-mono-tabular">{contact.phone}</td>
                  <td className="px-4 py-3 font-mono-tabular" style={{ color: 'var(--site-muted)' }}>
                    {contact.date || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(contact)}
                        disabled={!canEdit}
                        aria-label={`Edit ${contact.name}`}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-40"
                        style={{ borderColor: 'var(--site-border)', color: 'var(--site-text)' }}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(contact)}
                        disabled={!canDelete}
                        aria-label={`Delete ${contact.name}`}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-40"
                        style={{ borderColor: 'var(--site-border)', color: '#f87171' }}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
