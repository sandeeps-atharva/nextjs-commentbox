import { useAuth } from "@/context/AuthContext";
import AccountMenu from "./AccountMenu";
import { useTheme } from "@/context/ThemeProvider";
import { Menu } from "lucide-react";

function Header({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isAdmin =
    user.permissions.includes("manage_roles") ||
    user.permissions.includes("manage_users");

  return (
    <>
      {user && (
        <header
          className={`
    fixed z-10 px-2 py-4 flex justify-between items-center 
    transition-colors border-b border-gray-300 dark:border-gray-700
    bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white
    ${isAdmin ? "md:left-64 md:w-[calc(100%-16rem)] w-full" : "left-0 w-full"}
  `}
        >
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onMenuClick}
          >
            <Menu className="w-6 h-6" />
          </button>

          {!isAdmin && <div className="text-2xl font-bold">CommentBox</div>}

          <div className={`flex items-center gap-4 ${isAdmin && "ml-auto"}`}>
            <div className="flex flex-row gap-2 text-right">
              {!isAdmin ? (
                <div className="flex flex-row items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-sm p-1">
                  {user.role}
                </div>
              ) : (
                <p className="flex p-2 flex-row items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-sm p-1">
                  {user?.role}
                </p>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </button>

            <AccountMenu />
          </div>
        </header>
      )}
    </>
  );
}

export default Header;
