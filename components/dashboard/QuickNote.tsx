"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function QuickNote() {
  const { user } = useAuth();
  const [content, setContent] = useState<string>("Ideas for FocusDeck plugin architecture: SQLite local schema for user-defined cards, Rust IPC channels for background timers, and Raycast hotkey binding with zero electron footprint...");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      if (!supabase || !user) return;
      const { data, error } = await supabase.from('notes').select('*').eq('user_id', user.id).limit(1);
      if (!error && data && data.length > 0) {
        setContent(data[0].content);
        setNoteId(data[0].id);
      }
    }
    fetchNote();
  }, [user]);

  const handleSave = async () => {
    setIsEditing(false);
    if (!supabase || !user) return;
    
    setIsSaving(true);
    if (noteId) {
      await supabase.from('notes').update({ content, updated_at: new Date() }).eq('id', noteId).eq('user_id', user.id);
    } else {
      const { data } = await supabase.from('notes').insert([{ content, user_id: user.id }]).select();
      if (data && data.length > 0) {
        setNoteId(data[0].id);
      }
    }
    setIsSaving(false);
  };

  const deleteNote = async () => {
    if (!confirm("Are you sure you want to clear this note?")) return;
    setContent("");
    setIsEditing(false);
    
    if (supabase && noteId) {
      setIsSaving(true);
      await supabase.from('notes').update({ content: "" }).eq('id', noteId);
      setIsSaving(false);
    }
  };

  return (
    <div className="apple-glass apple-card-hover md:col-span-7 flex flex-col justify-between rounded-3xl p-6 border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden transition-all">
      {/* Ambient Apple Notes warm yellow glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFCC00]/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[19px]">edit_note</span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#1D1D1F] tracking-tight">Quick Note</h2>
              <span className="text-[11px] font-semibold text-[#86868B] px-2 py-0.5 rounded-full bg-black/[0.04]">Notes</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#86868B] font-medium">{isSaving ? 'Saving...' : 'Edited just now'}</span>
            <button
              onClick={deleteNote}
              className="w-7 h-7 rounded-full text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center justify-center transition-colors"
              title="Clear Note"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            autoFocus
            className="w-full bg-white/60 border border-white/80 rounded-2xl p-4 text-[#1D1D1F] text-sm leading-relaxed mt-2 outline-none focus:ring-2 focus:ring-[#007AFF]/30 resize-none min-h-[110px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="bg-white/50 hover:bg-white/70 border border-white/80 rounded-2xl p-4 text-[#1D1D1F] text-sm leading-relaxed mt-2 cursor-text min-h-[110px] whitespace-pre-wrap transition-all shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
          >
            {content || <span className="text-[#86868B] italic">Click here to jot down a quick note...</span>}
          </div>
        )}
      </div>

      <div className="pt-4 flex items-center justify-between text-xs text-[#86868B] border-t border-black/5 mt-3 font-medium">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
          <span>Saved to Apple Cloud / Supabase</span>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-[#007AFF] hover:text-[#0071EB] font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Open Full Editor</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
