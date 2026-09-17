"use client";

import React, { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import TaskModal from './TaskModal';
import { TaskItem, IMPORTANCE_CONFIG } from '@/types/task';

export default function TodayTasks() {
  const {
    tasks,
    badgeBox,
    todayString,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addBadge,
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [filterTodayOnly, setFilterTodayOnly] = useState(false);

  // Global keyboard shortcut: Cmd+T or Ctrl+T to open new task modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setEditingTask(null);
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const displayedTasks = filterTodayOnly
    ? tasks.filter((t) => t.dueDate === todayString)
    : tasks;

  const completedCount = displayedTasks.filter((t) => t.completed).length;
  const totalCount = displayedTasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

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

  return (
    <div className="apple-glass apple-card-hover md:col-span-5 flex flex-col justify-between rounded-3xl p-6 border border-white/80 shadow-sm">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
              <span className="material-symbols-outlined text-[18px]">checklist</span>
            </div>
            <h2 className="text-[16px] font-semibold text-gray-950 tracking-tight">Today&apos;s Tasks</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.04] text-gray-500 border border-black/5 hidden sm:inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-amber-500">swap_vert</span>
              By Importance
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <button
              onClick={() => setFilterTodayOnly(!filterTodayOnly)}
              title={filterTodayOnly ? 'Showing today only. Click to show all' : 'Showing all. Click to filter today'}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                filterTodayOnly
                  ? 'bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/25'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
              }`}
            >
              {filterTodayOnly ? 'Today only' : 'All dates'}
            </button>
            <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
              {completedCount} of {totalCount}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-black/[0.05] mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00C7BE] to-[#007AFF] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Task List (Apple Reminders Style) */}
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
          {displayedTasks.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-[13px] flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-[28px] opacity-40">task_alt</span>
              <span>No tasks found {filterTodayOnly ? 'for today' : ''}.</span>
              <button
                onClick={handleOpenAdd}
                className="mt-2 text-xs text-[#007AFF] hover:underline font-medium"
              >
                + Add your first task
              </button>
            </div>
          ) : (
            displayedTasks.map((task) => {
              const importanceConfig = IMPORTANCE_CONFIG[task.importance] || IMPORTANCE_CONFIG.Medium;
              const badgeObj = task.badge ? badgeBox.find((b) => b.name === task.badge) : null;
              const isToday = task.dueDate === todayString;

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all group ${
                    task.completed
                      ? 'bg-black/[0.02] opacity-60'
                      : 'hover:bg-black/[0.03] border border-transparent'
                  }`}
                >
                  {/* Left: Checkbox + Title + Metadata */}
                  <div
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                    onClick={() => toggleTask(task.id)}
                  >
                    {/* Apple Circular Checkbox */}
                    {task.completed ? (
                      <div className="w-5 h-5 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-[12px] shadow-xs shrink-0">
                        <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-[#007AFF] transition-colors shrink-0" />
                    )}

                    {/* Content */}
                    <div className="flex flex-col min-w-0 pr-2">
                      <span
                        className={`text-[13px] truncate font-normal transition-all ${
                          task.completed
                            ? 'line-through text-gray-400'
                            : 'text-gray-900 font-medium'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {/* Date indicator */}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                            isToday
                              ? 'text-[#007AFF] bg-[#007AFF]/10'
                              : 'text-gray-500 bg-black/[0.04]'
                          }`}
                        >
                          {isToday ? 'Today' : task.dueDate}
                        </span>

                        {/* Custom Badge from Badge Box */}
                        {task.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium border ${
                              badgeObj
                                ? `${badgeObj.color} ${badgeObj.textColor} ${badgeObj.borderColor}`
                                : 'bg-black/[0.03] text-gray-700 border-black/5'
                            }`}
                          >
                            {task.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Importance Pill & Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Hover Actions: Edit & Delete */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(task);
                        }}
                        title="Edit task"
                        className="w-6 h-6 rounded-md text-gray-400 hover:text-[#007AFF] hover:bg-black/5 flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        title="Delete task"
                        className="w-6 h-6 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>

                    {/* Importance Level Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        task.completed ? 'text-gray-400 bg-gray-100' : importanceConfig.badgeClass
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${importanceConfig.dotClass}`} />
                      <span>{importanceConfig.label}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Add Trigger */}
      <div className="pt-3 flex items-center justify-between mt-3 border-t border-black/5">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 text-[#007AFF] hover:text-blue-700 font-medium text-[13px] transition-colors"
        >
          <span className="material-symbols-outlined text-[17px]">add_circle</span>
          <span>Add Reminders Item</span>
        </button>
        <kbd className="apple-keycap font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded text-gray-600">
          ⌘T
        </kbd>
      </div>

      {/* Create / Edit Task Modal */}
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
