'use client';

import React from 'react';
import {
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { SyncEngineStatus, SyncEngineAdapter } from '@/types/note';
import { syncService } from '@/lib/sync/sync-service';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SyncEngineStatus;
  isAuthenticated: boolean;
  userEmail?: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function SyncStatusModal({
  isOpen,
  onClose,
  status,
  isAuthenticated,
  userEmail,
  onSignIn,
  onSignOut,
}: SyncStatusModalProps) {
  if (!isOpen) return null;

  const handleAdapterChange = (adapter: SyncEngineAdapter) => {
    syncService.setAdapterPreference(adapter);
  };

  const handleForceSync = () => {
    syncService.syncNow();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <RefreshCw
              className={`w-5 h-5 text-amber-500 ${
                status.mode === 'syncing' ? 'animate-spin' : ''
              }`}
            />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Modular Google Sync Engine
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Account Status Card */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                {isAuthenticated && userEmail ? userEmail[0].toUpperCase() : 'G'}
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {isAuthenticated ? userEmail : 'Local Demo Mode'}
                </div>
                <div className="text-xs text-neutral-500">
                  {isAuthenticated
                    ? 'Connected via Google OAuth 2.0'
                    : 'Changes stored locally in IndexedDB (Offline-Ready)'}
                </div>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                onClick={onSignOut}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={onSignIn}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-colors"
              >
                Sign in with Google
              </button>
            )}
          </div>

          {/* Sync Engine Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Sync Engine Architecture
              </span>
              <button
                onClick={handleForceSync}
                disabled={status.mode === 'syncing'}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${status.mode === 'syncing' ? 'animate-spin' : ''}`} />
                Force Sync Now
              </button>
            </div>

            {/* Adapters Grid */}
            <div className="space-y-2.5">
              {/* Adapter 1: Keep API */}
              <div
                onClick={() => handleAdapterChange('keep_api')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  status.activeAdapter === 'keep_api'
                    ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        Google Keep REST API
                        {status.activeAdapter === 'keep_api' && (
                          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Direct two-way mapping with official Google Keep service
                      </div>
                    </div>
                  </div>
                  {status.hasKeepAccess === false ? (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Enterprise Only
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Scope Authorized
                    </span>
                  )}
                </div>
              </div>

              {/* Adapter 2: Drive AppData Fallback */}
              <div
                onClick={() => handleAdapterChange('drive_fallback')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  status.activeAdapter === 'drive_fallback'
                    ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        Google Drive AppData Sync (Fallback)
                        {status.activeAdapter === 'drive_fallback' && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">
                            Active Fallback
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Seamlessly stores JSON payloads into hidden <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.2 rounded">appDataFolder</code> for personal Gmail accounts
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Consumer Ready
                  </span>
                </div>
              </div>

              {/* Adapter 3: IndexedDB Local-First */}
              <div
                onClick={() => handleAdapterChange('local_only')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  status.activeAdapter === 'local_only'
                    ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-sky-500" />
                    <div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        IndexedDB Offline-First Storage (Dexie.js)
                        {status.activeAdapter === 'local_only' && (
                          <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Zero latency, full offline access with automatic background queue
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                    Always On
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Smart Auto-Fallback:</strong> The Google Keep REST API is officially restricted to Google Workspace Enterprise domains. KeepPlus automatically detects when a standard consumer Gmail account connects (HTTP 403) and gracefully falls back to syncing encrypted JSON note bundles into your hidden Google Drive AppData folder without disrupting your workflow.
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>
            {status.lastSyncedAt
              ? `Last synced: ${new Date(status.lastSyncedAt).toLocaleTimeString()}`
              : 'Local storage active'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
