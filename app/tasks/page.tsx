"use client";

import React, { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import TaskModal from '@/components/dashboard/TaskModal';
import { TaskItem, IMPORTANCE_CONFIG, PRESET_BADGE_COLORS } from '@/types/task';

type FilterTab = 'all' | 'today' | 'upcoming' | 'completed';

export default function TasksPage() {
  const {
    tasks,
    badgeBox,
    todayString,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addBadge,
    deleteBadge,
  } = useTasks();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Badge box management modal/drawer state
  const [showBadgeManager, setShowBadgeManager] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const matchTitle = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBadge = t.badge?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle && !matchBadge) return false;
    }

    // 2. Badge Filter
    if (selectedBadgeFilter && t.badge !== selectedBadgeFilter) {
      return false;
    }

    // 3. Tab Filter
    if (activeTab === 'today') {
      return t.dueDate === todayString && !t.completed;
    }
    if (activeTab === 'upcoming') {
      return t.dueDate > todayString && !t.completed;
    }
    if (activeTab === 'completed') {
      return t.completed;
    }

    return true;
  });

  const urgentCount = tasks.filter((t) => !t.completed && t.importance === 'Urgent').length;
  const highCount = tasks.filter((t) => !t.completed && t.importance === 'High').length;
  const todayCount = tasks.filter((t) => !t.completed && t.dueDate === todayString).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const handleOpenAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: {
    title: string;
    importance: TaskItem['importance'];
    badge?: string;
    dueDate: string;
  }) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
  };

  const handleCreateBadgeFromManager = () => {
    if (!newBadgeName.trim()) return;
    addBadge(newBadgeName.trim(), selectedColorIdx);
    setNewBadgeName('');
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full gap-6 pb-12">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">task_alt</span>
            <h1 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface">Tasks</h1>
          </div>
          <p className="text-body-sm text-outline mt-1">
            Prioritized task management with automated importance sorting, due dates, and custom badges.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBadgeManager(!showBadgeManager)}
            className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-purple-400">local_offer</span>
            <span>Badge Box ({badgeBox.length})</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-medium shadow-md transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
          <span className="text-xs text-outline font-medium">Due Today</span>
          <span className="text-2xl font-bold text-primary mt-1">{todayCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-rose-500/20 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-medium">Urgent Priority</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <span className="text-2xl font-bold text-rose-400 mt-1">{urgentCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-amber-500/20 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">High Priority</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-2xl font-bold text-amber-400 mt-1">{highCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
          <span className="text-xs text-outline font-medium">Completed</span>
          <span className="text-2xl font-bold text-on-surface mt-1">{completedCount}</span>
        </div>
      </div>

      {/* Badge Box Manager Panel (Expandable) */}
      {showBadgeManager && (
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-purple-500/30 flex flex-col gap-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-[20px]">inventory_2</span>
              <h3 className="text-sm font-semibold text-on-surface">Your Badge Box</h3>
            </div>
            <span className="text-xs text-outline">Badges saved here are available for all future tasks</span>
          </div>

          {/* Add badge input */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="New badge name (e.g. Finance, Research)..."
              value={newBadgeName}
              onChange={(e) => setNewBadgeName(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary flex-1 min-w-[200px]"
            />
            <div className="flex items-center gap-1">
              {PRESET_BADGE_COLORS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedColorIdx(idx)}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    selectedColorIdx === idx ? 'ring-2 ring-primary scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.previewHex, borderColor: preset.previewHex }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleCreateBadgeFromManager}
              disabled={!newBadgeName.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary text-xs font-medium transition-colors"
            >
              Add to Box
            </button>
          </div>

          {/* Stored Badges list */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-outline-variant/15">
            {badgeBox.map((b) => (
              <div
                key={b.id}
                className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-2 ${b.color} ${b.textColor} ${b.borderColor}`}
              >
                <span>{b.name}</span>
                <button
                  type="button"
                  onClick={() => deleteBadge(b.id)}
                  title="Remove badge from box"
                  className="hover:opacity-70 text-[14px]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar: Tabs, Search & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/20">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'today', 'upcoming', 'completed'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-outline hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search tasks or badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Badge Quick Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-outline mr-1">Badge Filter:</span>
        <button
          onClick={() => setSelectedBadgeFilter(null)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            selectedBadgeFilter === null
              ? 'bg-primary/15 text-primary border-primary/40'
              : 'bg-surface-container-lowest border-outline-variant/30 text-outline hover:text-on-surface'
          }`}
        >
          All Badges
        </button>
        {badgeBox.map((badge) => {
          const isSelected = selectedBadgeFilter === badge.name;
          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadgeFilter(isSelected ? null : badge.name)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? `${badge.color} ${badge.textColor} ${badge.borderColor} ring-2 ring-primary`
                  : 'bg-surface-container-lowest border-outline-variant/25 text-outline hover:text-on-surface'
              }`}
            >
              {badge.name}
            </button>
          );
        })}
      </div>

      {/* Task List (Ordered Top to Bottom by Importance) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-outline px-1">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-amber-400">swap_vert</span>
            <span>Sorted Top to Bottom by Importance (Urgent → High → Medium → Low)</span>
          </span>
          <span>Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}</span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-outline opacity-40">task_alt</span>
            <p className="text-sm text-outline">No tasks match your filter criteria.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              + Create a new task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const config = IMPORTANCE_CONFIG[task.importance] || IMPORTANCE_CONFIG.Medium;
            const badgeObj = task.badge ? badgeBox.find((b) => b.name === task.badge) : null;
            const isToday = task.dueDate === todayString;

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                  task.completed
                    ? 'bg-surface-container/20 border-outline-variant/15 opacity-60'
                    : 'bg-surface-container-lowest border-outline-variant/25 hover:border-outline-variant/60 shadow-sm'
                }`}
              >
                {/* Checkbox + Details */}
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                      task.completed
                        ? 'bg-primary border-primary text-on-primary'
                        : 'border-outline-variant/50 group-hover:border-primary bg-surface-container/60'
                    }`}
                  >
                    {task.completed && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 pr-2">
                    <span
                      className={`text-sm font-medium transition-all ${
                        task.completed ? 'line-through text-outline' : 'text-on-surface'
                      }`}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {/* Date */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-mono ${
                          isToday
                            ? 'text-primary bg-primary/10'
                            : 'text-outline bg-surface-container'
                        }`}
                      >
                        {isToday ? 'Today' : task.dueDate}
                      </span>

                      {/* Custom Badge from Badge Box */}
                      {task.badge && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                            badgeObj
                              ? `${badgeObj.color} ${badgeObj.textColor} ${badgeObj.borderColor}`
                              : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                          }`}
                        >
                          {task.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Importance Badge & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Edit and Delete buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(task);
                      }}
                      title="Edit task"
                      className="w-7 h-7 rounded-lg text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      title="Delete task"
                      className="w-7 h-7 rounded-lg text-outline hover:text-error hover:bg-surface-container flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>

                  {/* Importance Pill */}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 ${
                      task.completed ? 'text-outline bg-surface-container' : config.badgeClass
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                    <span>{config.label}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        badgeBox={badgeBox}
        onAddBadgeToBox={addBadge}
        initialTask={editingTask}
        todayString={todayString}
      />
    </div>
  );
}
