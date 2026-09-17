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
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">task_alt</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">Tasks</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#86868B] dark:text-gray-400 mt-1.5">
            Prioritized task management with automated importance sorting, due dates, and custom badges.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBadgeManager(!showBadgeManager)}
            className="px-3.5 py-2 rounded-xl apple-glass border border-black/10 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-purple-500 dark:text-purple-400">local_offer</span>
            <span>Badge Box ({badgeBox.length})</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl apple-glass border border-black/5 dark:border-white/10 flex flex-col shadow-xs">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Due Today</span>
          <span className="text-2xl font-bold text-[#007AFF] dark:text-[#0A84FF] mt-1">{todayCount}</span>
        </div>
        <div className="p-4 rounded-2xl apple-glass border border-rose-500/25 bg-rose-500/5 dark:bg-rose-500/10 flex flex-col shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Urgent Priority</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{urgentCount}</span>
        </div>
        <div className="p-4 rounded-2xl apple-glass border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">High Priority</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{highCount}</span>
        </div>
        <div className="p-4 rounded-2xl apple-glass border border-black/5 dark:border-white/10 flex flex-col shadow-xs">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Completed</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{completedCount}</span>
        </div>
      </div>

      {/* Badge Box Manager Panel (Expandable) */}
      {showBadgeManager && (
        <div className="p-5 rounded-2xl apple-glass border border-purple-500/30 dark:border-purple-500/40 flex flex-col gap-4 animate-in fade-in duration-150 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500 dark:text-purple-400 text-[20px]">inventory_2</span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Badge Box</h3>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Badges saved here are available for all future tasks</span>
          </div>

          {/* Add badge input */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="New badge name (e.g. Finance, Research)..."
              value={newBadgeName}
              onChange={(e) => setNewBadgeName(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#007AFF] flex-1 min-w-[200px]"
            />
            <div className="flex items-center gap-1">
              {PRESET_BADGE_COLORS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedColorIdx(idx)}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                    selectedColorIdx === idx ? 'ring-2 ring-[#007AFF] scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.previewHex, borderColor: preset.previewHex }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleCreateBadgeFromManager}
              disabled={!newBadgeName.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer active:scale-95"
            >
              Add to Box
            </button>
          </div>

          {/* Stored Badges list */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-black/5 dark:border-white/10">
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
                  className="hover:opacity-70 text-[14px] cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar: Tabs, Search & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 apple-glass p-3 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
        {/* Tabs */}
        <div className="apple-segmented-bg p-1 rounded-xl flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'today', 'upcoming', 'completed'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] font-semibold shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search tasks or badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#007AFF] transition-all"
          />
        </div>
      </div>

      {/* Badge Quick Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1 font-medium">Badge Filter:</span>
        <button
          onClick={() => setSelectedBadgeFilter(null)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            selectedBadgeFilter === null
              ? 'bg-blue-500/15 text-[#007AFF] dark:text-[#0A84FF] border-blue-500/30 font-semibold shadow-xs'
              : 'apple-glass border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isSelected
                  ? `${badge.color} ${badge.textColor} ${badge.borderColor} ring-2 ring-[#007AFF] dark:ring-[#0A84FF] shadow-xs`
                  : 'apple-glass border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {badge.name}
            </button>
          );
        })}
      </div>

      {/* Task List (Ordered Top to Bottom by Importance) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1 font-medium">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-amber-500 dark:text-amber-400">swap_vert</span>
            <span>Sorted Top to Bottom by Importance (Urgent → High → Medium → Low)</span>
          </span>
          <span>Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}</span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl apple-glass border border-black/5 dark:border-white/10 flex flex-col items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500 opacity-40">task_alt</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">No tasks match your filter criteria.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline cursor-pointer"
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
                    ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-60'
                    : 'apple-glass apple-card-hover border-black/5 dark:border-white/10 shadow-xs hover:border-black/15 dark:hover:border-white/20'
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
                        ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-xs'
                        : 'border-black/20 dark:border-white/20 group-hover:border-[#007AFF] bg-black/5 dark:bg-white/5'
                    }`}
                  >
                    {task.completed && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 pr-2">
                    <span
                      className={`text-sm font-medium transition-all ${
                        task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {/* Date */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-medium ${
                          isToday
                            ? 'text-[#007AFF] dark:text-[#0A84FF] bg-blue-500/10 dark:bg-blue-500/15'
                            : 'text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5'
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
                              : 'bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-black/10 dark:border-white/10'
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
                      className="w-7 h-7 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      title="Delete task"
                      className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>

                  {/* Importance Pill */}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 ${
                      task.completed ? 'text-gray-400 dark:text-gray-500 bg-black/5 dark:bg-white/5' : config.badgeClass
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
