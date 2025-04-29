
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Chatbot from '../chatbot/Chatbot';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-hrm-light-gray">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-hrm-dark-cyan">HRM AI</span>
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
            © {new Date().getFullYear()} HRM AI. Todos los derechos reservados.
          </p>
        </div>
      </footer>
      <Chatbot userType="public" />
    </div>
  );
};

export default PublicLayout;
