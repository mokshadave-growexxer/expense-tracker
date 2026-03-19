import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your finances' },
  '/expenses':  { title: 'Expenses',  subtitle: 'Track your spending' },
  '/income':    { title: 'Income',    subtitle: 'Manage your earnings' },
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const { user } = useAuth();
  const page = pageTitles[location.pathname] || { title: 'FinTrack', subtitle: '' };
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-10 bg-slate-950/80 light:bg-white/80 backdrop-blur-xl border-b border-slate-800/60 light:border-slate-200 px-4 md:px-6 lg:px-8 py-4 transition-colors">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div>
            <h2 className="font-display text-xl font-semibold text-white light:text-slate-900">{page.title}</h2>
            <p className="text-xs text-slate-500 hidden sm:block">{page.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500 hidden md:block">{dateStr}</p>
          <DarkModeToggle />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}