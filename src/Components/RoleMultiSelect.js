import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

const RoleMultiSelect = ({ roles, roleFilters, setRoleFilters }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRole = (roleId) => {
    if (roleFilters.includes(roleId)) {
      setRoleFilters(roleFilters.filter((id) => id !== roleId));
    } else {
      setRoleFilters([...roleFilters, roleId]);
    }
  };

  const clearAll = () => {
    setRoleFilters([]);
    setOpen(false);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full sm:min-w-[200px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-indigo-500"
      >
        <span>All Roles</span>
        <ChevronDown size={16} className="ml-2" />
      </button>

      {open && (
        <div className="absolute mt-1 w-full sm:min-w-[200px] max-h-60 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-10">
          <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Select Roles
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-500 hover:underline"
            >
              Clear
            </button>
          </div>
          <ul className="p-2 space-y-1">
            {roles.map((role) => (
              <li key={role.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`role-${role.id}`}
                  checked={roleFilters.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                />
                <label
                  htmlFor={`role-${role.id}`}
                  className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  {role.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RoleMultiSelect;
