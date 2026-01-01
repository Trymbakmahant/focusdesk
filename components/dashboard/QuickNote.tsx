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
    <div className="md:col-span-7 flex flex-col justify-between bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Quick Note</h2>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm text-outline">{isSaving ? 'Saving...' : 'Edited just now'}</span>
            <button onClick={deleteNote} className="w-7 h-7 rounded-lg text-outline hover:text-error hover:bg-surface-container flex items-center justify-center transition-colors" title="Clear Note">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
        
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            autoFocus
            className="w-full bg-surface-container-low/80 rounded-xl p-space-md text-on-surface font-body-md text-body-md leading-relaxed mt-space-xs outline-none focus:ring-2 focus:ring-primary-fixed resize-none min-h-[100px]"
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="bg-surface-container-low/60 rounded-xl p-space-md text-on-surface font-body-md text-body-md leading-relaxed mt-space-xs cursor-text min-h-[100px] whitespace-pre-wrap"
          >
            {content || <span className="text-outline">Click to add a note...</span>}
          </div>
        )}
      </div>
      <div className="pt-space-md flex items-center justify-between text-label-sm font-label-sm">
        <span className="text-outline">Saved locally to notes.db</span>
        <button onClick={() => setIsEditing(true)} className="text-primary hover:text-primary-container font-label-md text-label-md flex items-center gap-1">
          <span>Open Full Editor</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
