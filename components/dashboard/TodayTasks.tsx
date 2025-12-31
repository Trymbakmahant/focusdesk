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
    <div className="md:col-span-5 flex flex-col justify-between bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">checklist</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Today's Tasks</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-outline border border-outline-variant/30 hidden sm:inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-amber-400">swap_vert</span>
              By Importance
            </span>
          </div>
          <div className="flex items-center gap-space-xs">
            {/* Filter Toggle */}
            <button
              onClick={() => setFilterTodayOnly(!filterTodayOnly)}
              title={filterTodayOnly ? 'Showing today only. Click to show all' : 'Showing all. Click to filter today'}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                filterTodayOnly
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-outline hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {filterTodayOnly ? 'Today only' : 'All dates'}
            </button>
            <span className="text-label-sm font-label-sm text-outline font-mono">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-surface-container mb-space-md overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Task List (Sorted by Importance Top to Bottom) */}
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
          {displayedTasks.length === 0 ? (
            <div className="py-8 text-center text-outline text-body-sm flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-[28px] opacity-40">task_alt</span>
              <span>No tasks found {filterTodayOnly ? 'for today' : ''}.</span>
              <button
                onClick={handleOpenAdd}
                className="mt-2 text-xs text-primary hover:underline font-medium"
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
                      ? 'bg-surface-container/30 opacity-60'
                      : 'hover:bg-surface-container-low border border-transparent hover:border-outline-variant/20'
                  }`}
                >
                  {/* Left: Checkbox + Title + Metadata */}
                  <div
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                    onClick={() => toggleTask(task.id)}
                  >
                    {/* Checkbox */}
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

                    {/* Content */}
                    <div className="flex flex-col min-w-0 pr-2">
                      <span
                        className={`text-sm truncate font-medium transition-all ${
                          task.completed
                            ? 'line-through text-outline'
                            : 'text-on-surface'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {/* Date indicator */}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
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
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
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
                        className="w-6 h-6 rounded-md text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        title="Delete task"
                        className="w-6 h-6 rounded-md text-outline hover:text-error hover:bg-surface-container flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>

                    {/* Importance Level Badge */}
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                        task.completed ? 'text-outline bg-surface-container' : importanceConfig.badgeClass
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
      <div className="pt-space-md flex items-center justify-between mt-3 border-t border-outline-variant/15">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 text-primary hover:text-primary-container font-medium text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>New task</span>
        </button>
        <span className="font-code-kbd text-code-kbd text-outline px-1.5 py-0.5 rounded bg-surface-container text-xs">
          ⌘T
        </span>
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
