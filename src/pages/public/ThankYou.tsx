
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ThankYou = () => {
  return (
    <div className="hrm-container text-center max-w-xl mx-auto py-16">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-hrm-light-gray">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-hrm-dark-green/20 mb-6">
          <Check className="h-8 w-8 text-hrm-dark-green" />
        </div>
        <h1 className="text-3xl font-bold text-hrm-dark-cyan mb-4">¡Aplicación Recibida!</h1>
        <p className="text-gray-600 mb-6">
          Gracias por tu interés en nuestra vacante. Hemos recibido tu aplicación y la revisaremos lo antes posible.
          Te contactaremos si tu perfil coincide con lo que estamos buscando.
        </p>
        <div className="space-y-4">
          <Button asChild className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue">
            <Link to="/jobs">Ver más vacantes</Link>
          </Button>
          <div>
            <Link to="/" className="text-hrm-steel-blue hover:underline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
