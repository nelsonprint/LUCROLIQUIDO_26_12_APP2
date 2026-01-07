import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft, Star, Download, Printer, Link2, Calendar, Filter,
  RefreshCw, ChevronDown, Search, X
} from 'lucide-react';

// Componente de Layout padrão para todos os relatórios
export const ReportLayout = ({
  user,
  onLogout,
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-400',
  iconBg = 'bg-blue-500/10',
  children,
  loading = false,
  error = null,
  onRetry,
  filters,
  onExportExcel,
  onExportPDF,
  reportId
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(() => {
    const favorites = JSON.parse(localStorage.getItem('report_favorites') || '[]');
    return favorites.includes(reportId);
  });

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('report_favorites') || '[]');
    const newFavorites = isFavorite
      ? favorites.filter(f => f !== reportId)
      : [...favorites, reportId];
    localStorage.setItem('report_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white print:bg-white print:text-black">
      <div className="print:hidden">
        <Sidebar user={user} onLogout={onLogout} activePage="relatorios" />
      </div>

      <div className="flex-1 p-8 ml-64 print:ml-0 print:p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start print:hidden">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/relatorios')}
                className="hover:bg-zinc-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className={`p-3 rounded-xl ${iconBg}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{title}</h1>
                  {subtitle && <p className="text-zinc-400 text-sm">{subtitle}</p>}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className="hover:bg-zinc-800"
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-500'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyLink}
                className="hover:bg-zinc-800"
              >
                <Link2 className="w-5 h-5 text-zinc-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrint}
                className="hover:bg-zinc-800"
              >
                <Printer className="w-5 h-5 text-zinc-500" />
              </Button>
              {onExportExcel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportExcel}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              )}
            </div>
          </div>

          {/* Print Header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
            <p className="text-sm text-gray-500 mt-2">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
          </div>

          {/* Filtros */}
          {filters && (
            <Card className="bg-zinc-900 border-zinc-800 print:hidden">
              <CardContent className="p-4">
                {filters}
              </CardContent>
            </Card>
          )}

          {/* Estados de UX */}
          {loading && (
            <div className="space-y-4">
              {/* Skeleton KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse w-1/2 mb-2" />
                      <div className="h-8 bg-zinc-800 rounded animate-pulse w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Skeleton Chart */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="h-64 bg-zinc-800 rounded animate-pulse" />
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <Card className="bg-zinc-900 border-zinc-800 border-red-500/30">
              <CardContent className="p-8 text-center">
                <div className="text-red-400 mb-4">
                  <X className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar relatório</h3>
                <p className="text-zinc-400 mb-4">{error}</p>
                {onRetry && (
                  <Button onClick={onRetry} variant="outline" className="border-zinc-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conteúdo */}
          {!loading && !error && children}
        </div>
      </div>
    </div>
  );
};

// Componente de KPI Card
export const KPICard = ({ title, value, subtitle, icon: Icon, color = 'text-blue-400', trend, trendUp }) => (
  <Card className="bg-zinc-900 border-zinc-800">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-zinc-800">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Componente de Tabela com drill-down
export const ReportTable = ({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Nenhum dado encontrado',
  emptyHint,
  searchable = true,
  sortable = true,
  pageSize = 10
}) => {
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar
  const filteredData = data.filter(row =>
    columns.some(col => {
      const value = row[col.key];
      return value?.toString().toLowerCase().includes(search.toLowerCase());
    })
  );

  // Ordenar
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Paginar
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">{emptyMessage}</p>
        {emptyHint && <p className="text-sm text-zinc-500 mt-2">{emptyHint}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      {searchable && (
        <div className="relative max-w-sm print:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Buscar na tabela..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-10 bg-zinc-800 border-zinc-700"
          />
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`text-left p-3 text-zinc-400 font-medium ${sortable ? 'cursor-pointer hover:text-white' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                  onClick={() => sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortColumn === col.key && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={row.id || idx}
                className={`border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className={`p-3 ${col.align === 'right' ? 'text-right' : ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between print:hidden">
          <p className="text-sm text-zinc-500">
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="border-zinc-700"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="border-zinc-700"
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Exportar para Excel/CSV
export const exportToExcel = (data, columns, filename) => {
  // Criar cabeçalho
  const header = columns.map(col => col.label).join(',');
  
  // Criar linhas
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      // Escapar vírgulas e aspas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );

  // Juntar tudo
  const csv = [header, ...rows].join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
