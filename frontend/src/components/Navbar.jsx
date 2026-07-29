import { useState } from 'react'
import {
  HeartHandshake,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserPlus,
  X,
} from 'lucide-react'

import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom'

import { motion, AnimatePresence } from 'framer-motion'

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  {
    label: "Home",
    to: "/",
  },
  {
    label: "Events",
    to: "/events",
  },
  {
    label: "About",
    to: "/about",
  },
  {
    label: "Contact",
    to: "/contact",
  },
];

export default function Navbar() {
  const {
    user,
    logout,
  } = useAuth()

  const {
    theme,
    toggleTheme,
  } = useTheme()

  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] =
    useState(false)

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    navigate('/')
  }

  const getDashboardLink = () => {
    if (user?.role === 'volunteer') {
      return '/volunteer/dashboard'
    }

    if (user?.role === 'org') {
      return '/org/dashboard'
    }

    if (user?.role === 'admin') {
      return '/admin/dashboard'
    }

    return '/'
  }

  const closeMobileMenu = () => {
    setMobileOpen(false)
  }

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-slate-200/50
        bg-white/70
        backdrop-blur-md
        dark:border-slate-800/50
        dark:bg-slate-900/70
      "
    >
      <nav
        className="
          mx-auto
          flex
          min-h-[76px]
          max-w-7xl
          items-center
          justify-between
          px-5
          sm:px-8
          lg:px-10
        "
      >
        <Link
          to="/"
          className="
            group
            flex
            items-center
            gap-3
          "
          onClick={closeMobileMenu}
        >
          <motion.span
            whileHover={{
              rotate: -8,
              scale: 1.06,
            }}
            className="
              grid
              h-11
              w-11
              place-items-center
              rounded-2xl
              bg-gradient-to-br
              from-primary
              to-secondary
              text-white
              shadow-lg
              shadow-primary/20
            "
          >
            <HeartHandshake size={23} />
          </motion.span>

          <span>
            <span
              className="
                block
                text-lg
                font-extrabold
                tracking-tight
                text-primary
                dark:text-white
              "
            >
              VolunteerConnect
            </span>

            <span
              className="
                hidden
                text-xs
                text-slate-500
                sm:block
                dark:text-slate-400
              "
            >
              Connect. Contribute. Grow.
            </span>
          </span>
        </Link>

        <div
          className="
            hidden
            items-center
            gap-7
            md:flex
          "
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `
                  text-sm
                  font-semibold
                  transition-colors
                  ${
                    isActive
                      ? 'text-primary dark:text-white'
                      : `
                        text-slate-600
                        hover:text-primary
                        dark:text-slate-300
                        dark:hover:text-white
                      `
                  }
                `
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div
          className="
            hidden
            items-center
            gap-3
            md:flex
          "
        >
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            className="
              grid
              h-11
              w-11
              place-items-center
              rounded-xl
              border
              border-slate-200
              bg-white/80
              text-slate-700
              transition
              hover:-translate-y-0.5
              hover:shadow-md
              dark:border-slate-700
              dark:bg-slate-800
              dark:text-amber-300
            "
          >
            {theme === 'dark' ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

          {user ? (
            <>
              <Link
                to={getDashboardLink()}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-primary
                  transition
                  hover:bg-primary/5
                  dark:text-white
                "
              >
                <LayoutDashboard
                  size={17}
                />

                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-red-50
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-red-600
                  transition
                  hover:bg-red-100
                  dark:bg-red-500/10
                  dark:text-red-300
                "
              >
                <LogOut size={17} />

                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  dark:text-slate-200
                  dark:hover:bg-slate-800
                "
              >
                <LogIn size={17} />

                Login
              </Link>

              <Link
                to="/register"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-primary
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-primary/20
                  transition
                  hover:-translate-y-0.5
                  hover:bg-[#1D1D43]
                "
              >
                <UserPlus size={17} />

                Get Started
              </Link>
            </>
          )}
        </div>

        <div
          className="
            flex
            items-center
            gap-2
            md:hidden
          "
        >
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="
              grid
              h-10
              w-10
              place-items-center
              rounded-xl
              border
              border-slate-200
              dark:border-slate-700
            "
          >
            {theme === 'dark' ? (
              <Sun
                size={18}
                className="text-amber-300"
              />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (open) => !open
              )
            }
            aria-label="Open navigation menu"
            className="
              grid
              h-10
              w-10
              place-items-center
              rounded-xl
              bg-primary
              text-white
            "
          >
            {mobileOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: 'auto',
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="
              overflow-hidden
              border-t
              border-slate-200
              bg-white/95
              px-5
              pb-5
              pt-3
              backdrop-blur-xl
              dark:border-slate-800
              dark:bg-slate-950/95
              md:hidden
            "
          >
            <div className="space-y-2">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="
                  block
                  rounded-xl
                  px-4
                  py-3
                  font-semibold
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                "
              >
                Home
              </Link>

              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    onClick={
                      closeMobileMenu
                    }
                    className="
                      block
                      rounded-xl
                      px-4
                      py-3
                      font-semibold
                      hover:bg-slate-100
                      dark:hover:bg-slate-800
                    "
                  >
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      w-full
                      rounded-xl
                      bg-red-50
                      px-4
                      py-3
                      text-left
                      font-semibold
                      text-red-600
                    "
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={
                      closeMobileMenu
                    }
                    className="
                      block
                      rounded-xl
                      px-4
                      py-3
                      font-semibold
                      hover:bg-slate-100
                      dark:hover:bg-slate-800
                    "
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={
                      closeMobileMenu
                    }
                    className="
                      block
                      rounded-xl
                      bg-primary
                      px-4
                      py-3
                      text-center
                      font-semibold
                      text-white
                    "
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}