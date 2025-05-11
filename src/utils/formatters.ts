
// Translation helpers for application status and job types

export function getStatusText(status: string) {
  const statusMap: {[key: string]: string} = {
    'new': 'Nuevo',
    'reviewing': 'En revisión',
    'interview': 'Entrevista',
    'selected': 'Seleccionado',
    'rejected': 'Rechazado',
    'hired': 'Contratado',
    'pending': 'Pendiente'
  };
  return statusMap[status] || status;
}

export function getJobTypeText(type: string) {
  const typeMap: {[key: string]: string} = {
    'full-time': 'Tiempo Completo',
    'part-time': 'Medio Tiempo',
    'contract': 'Contrato',
    'internship': 'Pasantía',
    'temporary': 'Temporal'
  };
  return typeMap[type] || type;
}
