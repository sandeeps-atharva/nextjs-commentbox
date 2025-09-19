import { useAuth } from "@/context/AuthContext";
import AccountMenu from "./AccountMenu";
import { useTheme } from "@/context/ThemeProvider";
import { Menu } from "lucide-react";

function Header({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {user && (
        <header
          className="
            fixed z-10 px-2 py-4 flex justify-between items-center 
            transition-colors border-b border-gray-300 dark:border-gray-700
            bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white
            left-0 w-full
          "
        >
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onMenuClick}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="text-2xl font-bold">CommentBox</div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex flex-row items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-sm p-1">
              {user?.role}
            </div>
            <AccountMenu />
          </div>
        </header>
      )}
    </>
  );
}

export default Header;
