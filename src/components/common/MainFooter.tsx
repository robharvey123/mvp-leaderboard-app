import { Link } from "react-router-dom";

export default function MainFooter() {
  return (
    <footer className="bg-blue-900 text-blue-100 py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Brookweald CC</h3>
            <p className="text-sm">
              Track your cricket performance and compete for the MVP title with our
              comprehensive leaderboard system.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-white">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/players" className="hover:text-white">
                  Players
                </Link>
              </li>
              <li>
                <Link to="/matches" className="hover:text-white">
                  Matches
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <address className="text-sm not-italic">
              <p>Brookweald Cricket Club</p>
              <p>123 Cricket Lane</p>
              <p>Brookweald, UK</p>
              <p className="mt-2">
                <a href="mailto:info@brookwealdcc.com" className="hover:text-white">
                  info@brookwealdcc.com
                </a>
              </p>
            </address>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-blue-800 text-center text-xs">
          <p>© {new Date().getFullYear()} Brookweald Cricket Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}