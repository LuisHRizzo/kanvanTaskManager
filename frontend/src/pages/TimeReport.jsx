import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store';

export default function TimeReport() {
  const user = useAuthStore((state) => state.user);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    fetchReport();
  }, [year, month]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/time/report/user?year=${year}&month=${month}`);
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← Volver
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Reporte de Tiempo
            </h1>
          </div>
          <div className="text-gray-700">
            Usuario: {user?.name}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={prevMonth}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Anterior
          </button>
          <span className="text-xl font-semibold">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Siguiente →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : report ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Resumen del Mes</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{report.totalFormatted}</div>
                  <div className="text-sm text-gray-600">Total registrado</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{report.entriesCount}</div>
                  <div className="text-sm text-gray-600">Entradas de tiempo</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{formatDuration(report.dailyAverage)}</div>
                  <div className="text-sm text-gray-600">Promedio diario</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Tiempo por Proyecto</h2>
              {report.byProject.length > 0 ? (
                <div className="space-y-3">
                  {report.byProject.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">{item.projectName}</span>
                      <span className="text-blue-600 font-bold">{item.formatted}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay registros de tiempo este mes</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Tiempo por Día</h2>
              {report.byDay.length > 0 ? (
                <div className="grid grid-cols-7 gap-2">
                  {report.byDay.map((item, idx) => (
                    <div key={idx} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{item.day}</div>
                      <div className="text-xs text-gray-600">{item.formatted}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay registros de tiempo este mes</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay datos disponibles
          </div>
        )}
      </main>
    </div>
  );
}