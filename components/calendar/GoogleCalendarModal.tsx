"use client";

import React, { useState } from 'react';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportUrl: (url: string) => Promise<number>;
  onImportIcs: (content: string) => number;
  onImportSample: () => number;
  existingUrl?: string;
  hasGoogleEvents: boolean;
  onClearGoogleEvents: () => void;
}

export default function GoogleCalendarModal({
  isOpen,
  onClose,
  onImportUrl,
  onImportIcs,
  onImportSample,
  existingUrl = '',
  hasGoogleEvents,
  onClearGoogleEvents,
}: GoogleCalendarModalProps) {
  const [tab, setTab] = useState<'url' | 'file' | 'paste' | 'sample'>('url');
  const [calendarUrl, setCalendarUrl] = useState(existingUrl);
  const [pastedIcs, setPastedIcs] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarUrl.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const count = await onImportUrl(calendarUrl.trim());
      setSuccessMsg(`Successfully imported ${count} events from Google Calendar!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(
        'Browser CORS blocked direct fetch to Google servers. Use the "Download & Drop" button below or upload the .ics file.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDirect = () => {
    if (!calendarUrl.trim()) {
      setErrorMsg('Please enter your Google Calendar iCal link first.');
      return;
    }
    // Opening the URL in browser causes Google to directly download basic.ics
    window.open(calendarUrl.trim(), '_blank');
    setSuccessMsg('Download initiated! Drag & drop the downloaded basic.ics file into the box below.');
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
        const count = onImportIcs(content);
        setSuccessMsg(`Successfully imported ${count} events from your Google Calendar .ics file!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: any) {
        setErrorMsg(err.message || 'Invalid or unreadable .ics file.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read selected file.');
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedIcs.trim()) return;

    try {
      const count = onImportIcs(pastedIcs.trim());
      setSuccessMsg(`Successfully imported ${count} events!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'No valid events found in pasted iCal content.');
    }
  };

  const handleSampleClick = () => {
    setErrorMsg(null);
    const count = onImportSample();
    setSuccessMsg(`Loaded ${count} sample Google Calendar events!`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gcal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col gap-5 text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                <path fill="#34A853" d="M7 10h5v5H7z"/>
                <path fill="#FBBC05" d="M12 10h5v5h-5z"/>
                <path fill="#EA4335" d="M7 15h5v5H7z"/>
              </svg>
            </div>
            <div>
              <h2 id="gcal-modal-title" className="font-headline-sm text-lg font-semibold text-on-surface leading-snug">
                Import Google Calendar
              </h2>
              <p className="text-xs text-outline">Synchronize meetings, deep work, and schedules</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-surface-container/70 p-1 rounded-xl gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setTab('url'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              tab === 'url' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">link</span>
            <span>iCal Link</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('file'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              tab === 'file' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">upload_file</span>
            <span>Upload .ics</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('paste'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              tab === 'paste' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">content_paste</span>
            <span>Paste .ics</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('sample'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              tab === 'sample' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">bolt</span>
            <span>Sample</span>
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="bg-error/15 border border-error/30 text-error-container rounded-xl p-3 flex items-start gap-2 text-xs">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0">error</span>
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-primary-container/20 border border-primary/30 text-primary-container rounded-xl p-3 flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: iCal URL with Direct Download & Drop */}
        {tab === 'url' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gcal-url-input" className="text-body-sm font-medium text-on-surface-variant flex items-center justify-between">
                <span>Google Calendar Secret iCal Address</span>
                <span className="text-[11px] text-outline">Private &amp; Secure</span>
              </label>
              <input
                id="gcal-url-input"
                type="url"
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary text-xs font-mono"
              />
            </div>

            {/* Quick 2-Step Flow to bypass browser CORS */}
            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/20 flex flex-col gap-3">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[16px]">bolt</span>
                <span>Fast 1-Click Import (Bypasses Google Browser CORS)</span>
              </span>
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDirect}
                  disabled={!calendarUrl.trim()}
                  className="w-full sm:flex-1 h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-50 text-on-surface text-xs font-medium flex items-center justify-center gap-1.5 border border-outline-variant/30 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                  <span>1. Download basic.ics</span>
                </button>

                <label className="w-full sm:flex-1 h-9 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[16px]">file_upload</span>
                  <span>2. Select basic.ics</span>
                  <input
                    type="file"
                    accept=".ics,.ical"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <span className="text-[11px] text-outline leading-relaxed">
                Click <strong>Download</strong> to grab your <code>basic.ics</code> file from Google, then click <strong>Select</strong> to import all events instantly.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={loading || !calendarUrl.trim()}
                className="w-full h-9 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-outline hover:text-on-surface text-xs font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? 'Attempting Direct Fetch...' : 'Or Try Direct Sync (if CORS allowed)'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Upload .ics File */}
        {tab === 'file' && (
          <div className="flex flex-col gap-4">
            <div className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer bg-surface-container/30 relative">
              <input
                type="file"
                accept=".ics,.ical"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-on-surface">Click to upload or drag &amp; drop</span>
                <span className="text-[11px] text-outline">Supported file: .ics exported from Google Calendar</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-[11px] text-outline leading-relaxed">
              <strong>Tip:</strong> In Google Calendar Settings, click <strong>"Import &amp; export"</strong> to download your calendar zip file, extract <code>.ics</code>, and drop it here.
            </div>
          </div>
        )}

        {/* Tab 3: Paste .ics Content */}
        {tab === 'paste' && (
          <form onSubmit={handlePasteSubmit} className="flex flex-col gap-3">
            <label className="text-body-sm font-medium text-on-surface-variant">
              Paste iCalendar (.ics) Content Directly
            </label>
            <textarea
              rows={6}
              placeholder="BEGIN:VCALENDAR... BEGIN:VEVENT... END:VEVENT... END:VCALENDAR"
              value={pastedIcs}
              onChange={(e) => setPastedIcs(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-[11px] focus:outline-none focus:border-primary resize-none placeholder:text-outline/50"
            />
            <button
              type="submit"
              disabled={!pastedIcs.trim()}
              className="w-full h-10 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">file_download_done</span>
              <span>Parse &amp; Import Pasted Calendar</span>
            </button>
          </form>
        )}

        {/* Tab 4: Quick Sample */}
        {tab === 'sample' && (
          <div className="flex flex-col gap-3 text-center p-4 rounded-xl bg-surface-container/40 border border-outline-variant/20">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <span className="material-symbols-outlined text-[24px]">event_available</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-on-surface">Load Sample Google Calendar Events</h3>
              <p className="text-xs text-outline leading-relaxed">
                Immediately populate your timeline with realistic Google Meet architecture reviews, deep focus sessions, and team syncs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSampleClick}
              className="mt-2 w-full h-10 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Load Sample Google Events</span>
            </button>
          </div>
        )}

        {/* Footer info: Clear option if already synced */}
        {hasGoogleEvents && (
          <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Google Calendar is currently synced</span>
            </span>
            <button
              type="button"
              onClick={onClearGoogleEvents}
              className="text-error hover:underline text-xs"
            >
              Clear Synced Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
