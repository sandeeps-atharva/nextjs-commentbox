import { User } from "lucide-react";
import React from "react";

const Avatar = ({ avatar }) => {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center text-white font-semibold">
      {avatar ? (
        <img
          src={avatar}
          alt={"Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <User />
      )}
    </div>
  );
};

export default Avatar;
