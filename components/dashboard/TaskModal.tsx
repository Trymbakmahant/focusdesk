"use client";

import React, { useState, useEffect } from 'react';
import {
  TaskItem,
  BadgeItem,
  ImportanceLevel,
  IMPORTANCE_CONFIG,
  PRESET_BADGE_COLORS,
} from '@/types/task';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: {
    title: string;
    importance: ImportanceLevel;
    badge?: string;
    dueDate: string;
  }) => void;
  badgeBox: BadgeItem[];
  onAddBadgeToBox: (name: string, colorIndex: number) => BadgeItem;
  initialTask?: TaskItem | null;
  todayString: string;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  badgeBox,
  onAddBadgeToBox,
  initialTask,
  todayString,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayString);
  const [importance, setImportance] = useState<ImportanceLevel>('Medium');
  const [selectedBadge, setSelectedBadge] = useState<string | undefined>(undefined);

  // New badge creation state
  const [showBadgeCreator, setShowBadgeCreator] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Sync initial task when opened
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDueDate(initialTask.dueDate || todayString);
      setImportance(initialTask.importance);
      setSelectedBadge(initialTask.badge);
    } else {
      setTitle('');
      setDueDate(todayString);
      setImportance('Medium');
      setSelectedBadge(undefined);
    }
    setShowBadgeCreator(false);
    setNewBadgeName('');
    setSelectedColorIndex(0);
  }, [initialTask, isOpen, todayString]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      importance,
      badge: selectedBadge,
      dueDate: dueDate || todayString,
    });
    onClose();
  };

  const handleCreateBadge = () => {
    if (!newBadgeName.trim()) return;
    const created = onAddBadgeToBox(newBadgeName.trim(), selectedColorIndex);
    setSelectedBadge(created.name);
    setNewBadgeName('');
    setShowBadgeCreator(false);
  };

  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col gap-5 text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              {initialTask ? 'edit_square' : 'add_task'}
            </span>
            <h2 id="task-modal-title" className="font-headline-sm text-lg font-semibold text-on-surface">
              {initialTask ? 'Edit Task' : 'Create New Task'}
            </h2>
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-title-input" className="text-body-sm font-medium text-on-surface-variant flex items-center justify-between">
              <span>Task Title</span>
              <span className="text-xs text-outline">Required</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              autoFocus
              placeholder="e.g. Review Tauri IPC bindings & update state"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
            />
          </div>

          {/* Date Selector (Default: Today) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="task-date-input" className="text-body-sm font-medium text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                <span>Due Date (Default: Today)</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDueDate(todayString)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    dueDate === todayString
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setTomorrow}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Tomorrow
                </button>
              </div>
            </div>
            <input
              id="task-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-sm"
            />
          </div>

          {/* Importance Level Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-body-sm font-medium text-on-surface-variant flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-amber-400">low_priority</span>
                <span>Importance Level (Sorted Top to Bottom)</span>
              </span>
              <span className="text-xs text-outline">{IMPORTANCE_CONFIG[importance].label} priority</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Urgent', 'High', 'Medium', 'Low'] as ImportanceLevel[]).map((level) => {
                const config = IMPORTANCE_CONFIG[level];
                const isSelected = importance === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setImportance(level)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-medium ${
                      isSelected
                        ? `${config.badgeClass} ring-2 ring-primary/40 shadow-sm scale-[1.02]`
                        : 'border-outline-variant/30 bg-surface-container/60 text-outline hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                      <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
                    </div>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badge Box Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-body-sm font-medium text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-purple-400">local_offer</span>
                <span>Badge Box</span>
              </label>
              <button
                type="button"
                onClick={() => setShowBadgeCreator(!showBadgeCreator)}
                className="text-xs text-primary hover:text-primary-container flex items-center gap-1 font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showBadgeCreator ? 'expand_less' : 'add'}
                </span>
                <span>{showBadgeCreator ? 'Hide Creator' : '+ Create Badge'}</span>
              </button>
            </div>

            {/* Inline Badge Creator */}
            {showBadgeCreator && (
              <div className="p-3 rounded-xl bg-surface-container/80 border border-outline-variant/30 flex flex-col gap-2.5 animate-in fade-in duration-150">
                <span className="text-xs font-medium text-on-surface">Add New Badge to Box (Stored for Future Tasks):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Badge name (e.g. Bug, Research, DevOps)"
                    value={newBadgeName}
                    onChange={(e) => setNewBadgeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateBadge();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-surface-container-highest border border-outline-variant/40 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleCreateBadge}
                    disabled={!newBadgeName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">save</span>
                    <span>Add</span>
                  </button>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-outline">Accent Color:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_BADGE_COLORS.map((preset, index) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setSelectedColorIndex(index)}
                        title={preset.name}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          selectedColorIndex === index
                            ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface-container scale-110'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.previewHex, borderColor: preset.previewHex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Badges in the Box */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedBadge(undefined)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedBadge === undefined
                    ? 'bg-surface-container-high border-primary text-on-surface ring-1 ring-primary'
                    : 'bg-surface-container/50 border-outline-variant/20 text-outline hover:text-on-surface'
                }`}
              >
                None
              </button>
              {badgeBox.map((badge) => {
                const isSelected = selectedBadge === badge.name;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setSelectedBadge(badge.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      badge.color
                    } ${badge.textColor} ${badge.borderColor} ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface-container-lowest font-semibold scale-105'
                        : 'opacity-85 hover:opacity-100 hover:scale-[1.02]'
                    }`}
                  >
                    <span>{badge.name}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[12px]">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/20 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary text-xs font-medium shadow-md transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {initialTask ? 'save' : 'add'}
              </span>
              <span>{initialTask ? 'Save Changes' : 'Add Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
