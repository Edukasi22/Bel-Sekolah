import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Palmtree,
  Volume2,
  Sliders,
  Building2,
  History,
  Activity,
  Database,
  X,
  BellRing,
  ShieldCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'status'
  | 'schedules'
  | 'special'
  | 'holidays'
  | 'manual'
  | 'sound'
  | 'school'
  | 'history'
  | 'diagnostics'
  | 'backup';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const menuItems: Array<{ id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'status', label: 'Status Sistem', icon: ShieldCheck },
    { id: 'schedules', label: 'Jadwal Bel Mingguan', icon: CalendarDays },
    { id: 'special', label: 'Jadwal Khusus', icon: CalendarCheck2 },
    { id: 'holidays', label: 'Hari Libur', icon: Palmtree },
    { id: 'manual', label: 'Bel Manual', icon: BellRing },
    { id: 'sound', label: 'Pengaturan Suara', icon: Sliders },
    { id: 'school', label: 'Pengaturan Sekolah', icon: Building2 },
    { id: 'history', label: 'Riwayat Bel', icon: History },
    { id: 'diagnostics', label: 'Diagnostik & Uji', icon: Activity },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
  ];

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-amber-400">
              <Volume2 className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">BEL SEKOLAH SD</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>

          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[44px] text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-center">
          <div className="text-[11px] text-slate-400 font-medium">Sistem Bel SD v2.0</div>
          <div className="text-[10px] text-slate-500 mt-0.5">100% Offline-Ready & PWA</div>
        </div>
      </aside>
    </>
  );
};
