import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { axiosInstance } from '../App';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, Settings } from 'lucide-react';

// Cores neon para o gráfico
const NEON_COLORS = [
  '#00ff88', '#00ffff', '#ff00ff', '#ffff00', '#ff8800', '#ff0088',
  '#88ff00', '#00aaff', '#ff4444', '#44ff88', '#8844ff', '#ff8844'
];

const MarkupDonutChart = ({ companyId, onConfigClick }) => {
  const [seriesData, setSeriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonthData, setCurrentMonthData] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchMarkupSeries();
    }
  }, [companyId]);

  const fetchMarkupSeries = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/markup-profile/series/${companyId}?months=12`);
      const data = response.data;
      
      // Preparar dados para o gráfico donut
      const chartData = data
        .filter(item => item.has_data)
        .map((item, index) => ({
          name: item.month,
          value: item.bdi || 0,
          markup: item.markup || 1,
          fill: NEON_COLORS[index % NEON_COLORS.length]
        }));
      
      setSeriesData(chartData);
      
      // Identificar mês atual
      const today = new Date();
      const currentMonth = data.find(
        d => d.year === today.getFullYear() && d.month_num === (today.getMonth() + 1)
      );
      setCurrentMonthData(currentMonth);
      
    } catch (error) {
      console.error('Erro ao carregar série de markup:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-purple-500/50 rounded-lg p-3 shadow-lg shadow-purple-500/20">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-purple-400">Markup: <span className="text-white">{data.markup?.toFixed(4)}x</span></p>
          <p className="text-green-400">BDI: <span className="text-white">{data.value?.toFixed(2)}%</span></p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-bold"
        style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}
      >
        {value?.toFixed(0)}%
      </text>
    );
  };

  return (
    <Card className="glass border-white/10 hover-lift">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
          <TrendingUp className="text-purple-400" size={20} />
          Markup/BDI - Últimos 12 Meses
        </CardTitle>
        <button
          onClick={onConfigClick}
          className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 transition-colors"
          title="Configurar Markup"
        >
          <Settings size={18} className="text-purple-400" />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : seriesData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
            <TrendingUp size={48} className="mb-4 opacity-30" />
            <p>Nenhuma configuração de markup encontrada</p>
            <button
              onClick={onConfigClick}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
            >
              Configurar Primeiro Markup
            </button>
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  {seriesData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.fill} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={entry.fill} stopOpacity={0.4} />
                    </linearGradient>
                  ))}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={seriesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={800}
                  filter="url(#glow)"
                >
                  {seriesData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index})`}
                      stroke={entry.fill}
                      strokeWidth={2}
                      style={{
                        filter: 'drop-shadow(0 0 6px ' + entry.fill + ')'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Centro do donut */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              {currentMonthData?.has_data ? (
                <>
                  <p className="text-gray-400 text-xs">Mês Atual</p>
                  <p className="text-2xl font-bold text-white">{currentMonthData.markup?.toFixed(2)}x</p>
                  <p className="text-green-400 text-sm">{currentMonthData.bdi?.toFixed(1)}% BDI</p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-xs">Mês Atual</p>
                  <p className="text-yellow-400 text-sm">Não configurado</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Legenda customizada */}
        {seriesData.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {seriesData.slice(-8).map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ 
                    backgroundColor: item.fill,
                    boxShadow: `0 0 6px ${item.fill}`
                  }} 
                />
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarkupDonutChart;
