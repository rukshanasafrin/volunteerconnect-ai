import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/**
 * Compact light/dark mode toggle used inside the Admin, Volunteer, and
 * Organization dashboards (which render their own top bar instead of the
 * public Navbar). Shares the same ThemeContext/localStorage state as the
 * public site toggle, so switching here or on the public pages stays in sync.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 ${className}`}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}