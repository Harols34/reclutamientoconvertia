
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Chatbot from '../chatbot/Chatbot';
import ConvertIALogo from '@/assets/convert-ia-logo';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-hrm-light-gray">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <ConvertIALogo className="h-10" />
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/jobs" className="text-gray-600 hover:text-hrm-dark-cyan">
                  Vacantes
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-gray-600 hover:text-hrm-dark-cyan">
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-50 border-t border-hrm-light-gray">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">
            CONVERT-IA RECLUTAMIENTO
          </p>
        </div>
      </footer>
      <Chatbot userType="public" />
    </div>
  );
};

export default PublicLayout;
