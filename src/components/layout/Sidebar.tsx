'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  CheckSquare,
  Archive,
  Trash2,
  Tag as TagIcon,
  ChevronRight,
  ChevronDown,
  X,
  HardDrive,
  FolderTree,
} from 'lucide-react';
import { TagTreeNode } from '@/types/note';

export type SidebarFilterMode = 'all' | 'checklists' | 'untagged' | 'archive' | 'trash';

interface SidebarProps {
  currentFilter: SidebarFilterMode;
  onSelectFilter: (mode: SidebarFilterMode) => void;
  tagTree: TagTreeNode[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  counts: {
    all: number;
    checklists: number;
    untagged: number;
    archive: number;
    trash: number;
  };
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentFilter,
  onSelectFilter,
  tagTree,
  selectedTag,
  onSelectTag,
  counts,
  isOpen,
  onCloseMobile,
}: SidebarProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (path: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const navItems = [
    {
      id: 'all' as const,
      label: 'Notes',
      icon: Lightbulb,
      count: counts.all,
    },
    {
      id: 'checklists' as const,
      label: 'Checklists',
      icon: CheckSquare,
      count: counts.checklists,
    },
    {
      id: 'untagged' as const,
      label: 'Untagged',
      icon: TagIcon,
      count: counts.untagged,
    },
    {
      id: 'archive' as const,
      label: 'Archive',
      icon: Archive,
      count: counts.archive,
    },
    {
      id: 'trash' as const,
      label: 'Trash',
      icon: Trash2,
      count: counts.trash,
    },
  ];

  const renderTagTree = (nodes: TagTreeNode[], depth: number = 0) => {
    return (
      <div className="space-y-0.5">
        {nodes.map((node) => {
          const isExpanded = expandedNodes[node.fullPath] !== false; // default open
          const hasChildren = node.children && node.children.length > 0;
          const isSelected = selectedTag === node.fullPath;

          return (
            <div key={node.fullPath}>
              <div
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
                className={`flex items-center justify-between py-1.5 pr-2.5 rounded-xl cursor-pointer text-xs transition-colors group ${
                  isSelected
                    ? 'bg-amber-500/15 text-amber-900 dark:text-amber-100 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
                onClick={() => {
                  onSelectTag(isSelected ? null : node.fullPath);
                  if (onCloseMobile) onCloseMobile();
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {hasChildren ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(node.fullPath);
                      }}
                      className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <TagIcon className="w-3 h-3 text-neutral-400 shrink-0 ml-1" />
                  )}
                  <span className="truncate">#{node.name}</span>
                </div>

                <span className="text-[11px] font-mono text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                  {node.count}
                </span>
              </div>

              {hasChildren && isExpanded && renderTagTree(node.children, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'
        }`}
      >
        <div className="p-3 overflow-y-auto space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = currentFilter === item.id && !selectedTag;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectFilter(item.id);
                    onSelectTag(null);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-100 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">{item.count}</span>
                </button>
              );
            })}
          </div>

          {/* Hierarchical Tags Tree */}
          <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" />
                Tags Tree
              </span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {selectedTag && (
              <div className="px-2 py-1 bg-amber-500/10 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center justify-between">
                <span className="truncate">Active: #{selectedTag}</span>
              </div>
            )}

            {tagTree.length > 0 ? (
              renderTagTree(tagTree)
            ) : (
              <div className="px-2 py-3 text-xs text-neutral-400 italic">
                Add #parent/child tags to notes to organize them hierarchically.
              </div>
            )}
          </div>
        </div>

        {/* Footer info: Local Storage */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 text-[11px] text-neutral-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
            <span>Dexie IndexedDB</span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Offline-Ready</span>
        </div>
      </aside>
    </>
  );
}
