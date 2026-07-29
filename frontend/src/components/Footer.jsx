import { Heart, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
const currentYear = new Date().getFullYear();

return ( <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"> <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8"> <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
{/* Brand */} <div> <Link
           to="/"
           className="flex items-center gap-3"
           aria-label="VolunteerConnect Home"
         > <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#272757] text-lg font-bold text-white shadow-md">
VC </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              VolunteerConnect
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Connect. Contribute. Create impact.
            </p>
          </div>
        </Link>

        <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
          Discover meaningful volunteer opportunities, manage events, track
          your contributions, and connect with communities.
        </p>
      </div>

      {/* Platform Links */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
          Platform
        </h3>

        <ul className="mt-5 space-y-3">
          <li>
            <Link
              to="/events"
              className="text-sm text-slate-600 transition hover:text-[#505081] dark:text-slate-400 dark:hover:text-[#8686AC]"
            >
              Explore Events
            </Link>
          </li>

          <li>
            <Link
              to="/login"
              className="text-sm text-slate-600 transition hover:text-[#505081] dark:text-slate-400 dark:hover:text-[#8686AC]"
            >
              Login
            </Link>
          </li>

          <li>
            <Link
              to="/register"
              className="text-sm text-slate-600 transition hover:text-[#505081] dark:text-slate-400 dark:hover:text-[#8686AC]"
            >
              Create Account
            </Link>
          </li>
        </ul>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
          Quick Links
        </h3>

        <ul className="mt-5 space-y-3">
          <li>
            <Link
              to="/"
              className="text-sm text-slate-600 transition hover:text-[#505081] dark:text-slate-400 dark:hover:text-[#8686AC]"
            >
              Home
            </Link>
          </li>

          <li>
            <Link
              to="/events"
              className="text-sm text-slate-600 transition hover:text-[#505081] dark:text-slate-400 dark:hover:text-[#8686AC]"
            >
              Opportunities
            </Link>
          </li>

          <li>
            <Link
              to="/register"
              className="text-sm text-slate-600 transition hover:text-[#505081] dark:text-slate-400 dark:hover:text-[#8686AC]"
            >
              Join as a Volunteer
            </Link>
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
          Get in Touch
        </h3>

        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3">
            <Mail
              size={18}
              className="mt-0.5 shrink-0 text-[#505081] dark:text-[#8686AC]"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Contact support through the platform
            </span>
          </div>

          <div className="flex items-start gap-3">
            <MapPin
              size={18}
              className="mt-0.5 shrink-0 text-[#505081] dark:text-[#8686AC]"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Building stronger communities together
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Section */}
    <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-7 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate-500 dark:text-slate-400">
        © {currentYear} VolunteerConnect. All rights reserved.
      </p>

      <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
        Built with
        <Heart
          size={15}
          className="fill-current text-red-500"
          aria-label="love"
        />
        for community impact
      </p>
    </div>
  </div>
</footer>

);
};

export default Footer;
