import { useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScoutChat from "./components/ScoutChat";

const HIDE_LAYOUT = [
  "/volunteer/dashboard",
  "/org/dashboard",
  "/admin/dashboard",
];

function App() {
  const location = useLocation();

  const hideLayout = HIDE_LAYOUT.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Public Navbar */}
      {!hideLayout && <Navbar />}

      {/* Main Content */}
      <main className="flex-1">
        <AppRoutes />
      </main>

      {/* Public Footer */}
      {!hideLayout && <Footer />}

      {/* Floating AI Assistant */}
      <ScoutChat />
    </div>
  );
}

export default App;