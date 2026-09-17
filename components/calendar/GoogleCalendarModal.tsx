"use client";

import React, { useState } from 'react';
import { useCalendar } from '@/hooks/useCalendar';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportUrl?: (url: string) => Promise<number>;
  onImportIcs?: (content: string) => number;
  existingUrl?: string;
  hasGoogleEvents?: boolean;
  onClearGoogleEvents?: () => void;
}

export default function GoogleCalendarModal({
  isOpen,
  onClose,
  onImportIcs,
}: GoogleCalendarModalProps) {
  const {
    isGoogleConnected,
    isGoogleConfigured,
    isSyncing,
    syncGoogleCalendar,
    connectGoogleOAuth,
    disconnectGoogle,
    importIcs,
  } = useCalendar();

  const [tab, setTab] = useState<'oauth' | 'file'>('oauth');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const count = await syncGoogleCalendar();
      setSuccessMsg(`Successfully synchronized ${count} events from Google Calendar!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await disconnectGoogle();
      setSuccessMsg('Google Calendar disconnected.');
    } catch {
      setErrorMsg('Failed to disconnect Google Calendar.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parseFn = onImportIcs || importIcs;
        const count = parseFn(content);
        setSuccessMsg(`Successfully imported ${count} events from .ics file!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid calendar file format';
        setErrorMsg(msg);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-surface-container-low/95 border border-outline-variant/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shadow-xs border border-outline-variant/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                <path fill="#34A853" d="M7 10h5v5H7z"/>
                <path fill="#FBBC05" d="M12 10h5v5h-5z"/>
                <path fill="#EA4335" d="M7 15h5v5H7z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-base font-semibold">Google Calendar Integration</h2>
              <span className="text-xs text-outline">Synchronize your official Google Calendar events &amp; meetings</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="bg-error/15 border border-error/30 text-error-container rounded-xl p-3 flex items-start gap-2 text-xs">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0">error</span>
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab switchers */}
        <div className="flex bg-surface-container/70 p-1 rounded-xl gap-1 text-xs">
          <button
            type="button"
            onClick={() => setTab('oauth')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === 'oauth'
                ? 'bg-surface text-on-surface shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Google OAuth 2.0 (Official)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === 'file'
                ? 'bg-surface text-on-surface shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Manual .ics Export</span>
          </button>
        </div>

        {/* Tab Content: Google OAuth 2.0 */}
        {tab === 'oauth' && (
          <div className="flex flex-col gap-4">
            {isGoogleConnected ? (
              /* Already connected view */
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-xs text-emerald-300">Google Calendar Connected</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/80 uppercase font-mono">OAuth 2.0 Active</span>
                </div>
                <p className="text-xs text-outline leading-relaxed">
                  Your Google Calendar is authenticated. FocusDeck will automatically retrieve your upcoming events and schedule timers.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={loading || isSyncing}
                    className="flex-1 h-9 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${(loading || isSyncing) ? 'animate-spin' : ''}`}>sync</span>
                    <span>{(loading || isSyncing) ? 'Syncing...' : 'Sync Calendar Now'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="px-3 h-9 rounded-xl bg-surface-container hover:bg-error/20 hover:text-error text-xs font-medium text-outline transition-colors border border-outline-variant/20"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              /* Unconnected view */
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-2xl bg-surface-container/40 border border-outline-variant/20 flex flex-col gap-2">
                  <span className="font-semibold text-xs text-on-surface">Automatic Calendar Synchronization</span>
                  <p className="text-xs text-outline leading-relaxed">
                    Connect your Google account using standard OAuth 2.0. FocusDeck will securely read your primary calendar to show your next meetings, focus blocks, and live countdowns.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-outline">
                      <span className="material-symbols-outlined text-[16px] text-primary">videocam</span>
                      <span>Google Meet Join links</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-outline">
                      <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                      <span>Next Event live countdown</span>
                    </div>
                  </div>
                </div>

                {/* Setup guidance banner if Google Cloud keys not yet present in .env.local */}
                {!isGoogleConfigured && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-2 text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0">info</span>
                      <span className="font-semibold text-amber-300">Google Cloud Credentials Setup</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Enable the <strong>Google Calendar API</strong> in Google Cloud Console and add these to <code className="bg-amber-950/60 px-1 py-0.5 rounded font-mono text-amber-100">frontend/.env.local</code>:
                    </p>
                    <div className="bg-surface-container-lowest/90 p-2 rounded-lg font-mono text-[10px] text-on-surface flex flex-col gap-0.5 select-text overflow-x-auto">
                      <span>GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com</span>
                      <span>GOOGLE_CLIENT_SECRET=your_client_secret</span>
                      <span>GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback</span>
                    </div>
                  </div>
                )}

                {/* Connect button */}
                <button
                  type="button"
                  onClick={connectGoogleOAuth}
                  className="w-full h-11 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Connect with Google Account</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Manual File Upload */}
        {tab === 'file' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-outline leading-relaxed">
              Export your Google Calendar as a <code>.ics</code> file (Google Calendar Settings &gt; Import &amp; Export) and drop it here.
            </p>

            <label className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-surface-container/20 hover:bg-surface-container/40">
              <span className="material-symbols-outlined text-primary text-[32px]">upload_file</span>
              <span className="font-semibold text-xs text-on-surface">Click to upload or drag and drop</span>
              <span className="text-[11px] text-outline">.ics or .ical calendar file</span>
              <input
                type="file"
                accept=".ics,.ical,text/calendar"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
