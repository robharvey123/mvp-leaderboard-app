import { NavLink } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="opacity-70 mb-4">The route you requested doesn’t exist.</p>
      <NavLink to="/" className="px-4 py-2 rounded-xl bg-black text-white">
        Go Home
      </NavLink>
    </div>
  );
}
