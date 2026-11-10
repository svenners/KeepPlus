'use client';

import React from 'react';
import {
  Menu,
  Search,
  LayoutGrid,
  Kanban,
  FileText,
  RefreshCw,
  UploadCloud,
  Moon,
  Sun,
  Keyboard,
  Command,
  Cloud,
  HardDrive,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { ViewMode, SyncEngineStatus } from '@/types/note';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  syncStatus: SyncEngineStatus;
  onOpenSyncModal: () => void;
  onOpenTakeoutModal: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcutsModal: () => void;
  onToggleSidebar: () => void;
  onNewNote?: () => void;
  isAuthenticated: boolean;
  userEmail?: string | null;
  userImage?: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  syncStatus,
  onOpenSyncModal,
  onOpenTakeoutModal,
  onOpenCommandPalette,
  onOpenShortcutsModal,
  onToggleSidebar,
  onNewNote,
  isAuthenticated,
  userEmail,
  userImage,
  onSignIn,
  isDarkMode,
  onToggleDarkMode,
}: HeaderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sync status badge configuration
  const getSyncBadge = () => {
    if (syncStatus.mode === 'syncing') {
      return {
        icon: RefreshCw,
        text: 'Syncing...',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        spin: true,
      };
    }
    if (syncStatus.mode === 'offline') {
      return {
        icon: AlertCircle,
        text: 'Offline',
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
        spin: false,
      };
    }
    if (syncStatus.mode === 'error') {
      return {
        icon: AlertCircle,
        text: 'Sync Issue',
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800',
        spin: false,
      };
    }
    if (syncStatus.activeAdapter === 'drive_fallback') {
      return {
        icon: CheckCircle2,
        text: 'Drive AppData',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
        spin: false,
      };
    }
    if (syncStatus.activeAdapter === 'keep_api') {
      return {
        icon: CheckCircle2,
        text: 'Keep API',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
        spin: false,
      };
    }
    return {
      icon: HardDrive,
      text: 'Local Ready',
      color: 'text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
      spin: false,
    };
  };

  const badge = mounted
    ? getSyncBadge()
    : {
        icon: HardDrive,
        text: 'Local Ready',
        color: 'text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
        spin: false,
      };
  const BadgeIcon = badge.icon;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between gap-4">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors md:hidden"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer">
          {/* Google Keep styled bulb with plus badge */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <span className="font-bold text-lg leading-none">K⁺</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
                KeepPlus
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400">
                Pro
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-xl mx-2 hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search notes, markdown, tasks (press / to focus)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-12 py-2 text-sm rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
          <kbd className="absolute right-3.5 top-2.5 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-white dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600">
            /
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Create Note Quick Button */}
        {onNewNote && (
          <button
            id="btn-header-new-note"
            data-testid="new-note-button"
            onClick={onNewNote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Create New Note (C)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>
        )}

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
          title="Command Palette (Cmd+K)"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="hidden md:inline font-mono">Cmd+K</span>
        </button>

        {/* Layout Switcher */}
        <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => onViewModeChange('masonry')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'masonry'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            title="Masonry Grid (Cmd+1)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            title="Kanban Board (Cmd+2)"
          >
            <Kanban className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('focus')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'focus'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            title="Focus List (Cmd+3)"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Status Pill */}
        <button
          onClick={onOpenSyncModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${badge.color}`}
          title="Click to view Google Sync status & adapters"
        >
          <BadgeIcon className={`w-3.5 h-3.5 ${badge.spin ? 'animate-spin' : ''}`} />
          <span className="hidden lg:inline">{badge.text}</span>
        </button>

        {/* Takeout Importer Trigger */}
        <button
          onClick={onOpenTakeoutModal}
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors hidden sm:block"
          title="Import Takeout Archive (I)"
        >
          <UploadCloud className="w-4 h-4" />
        </button>

        {/* Shortcuts Cheat Sheet */}
        <button
          onClick={onOpenShortcutsModal}
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors hidden sm:block"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Google User Avatar / Sign In */}
        {isAuthenticated ? (
          <button
            onClick={onOpenSyncModal}
            className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-xs"
            title={userEmail || 'Google Account'}
          >
            {userEmail ? userEmail[0].toUpperCase() : 'G'}
          </button>
        ) : (
          <button
            onClick={onSignIn}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
