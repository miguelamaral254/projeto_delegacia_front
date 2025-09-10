import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api.service';

const CrimeHeatmapTable = () => {
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [crimeTypeOptions, setCrimeTypeOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);

    const [bairroFilter, setBairroFilter] = useState('');
    const [hourFilter, setHourFilter] = useState('all');
    const [crimeTypeFilter, setCrimeTypeFilter] = useState('');
    const [dayOfWeekFilter, setDayOfWeekFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');

    const dayOfWeekOptions = [
        { value: 'all', label: 'Todos os Dias' },
        { value: 0, label: 'Segunda-feira' },
        { value: 1, label: 'Terça-feira' },
        { value: 2, label: 'Quarta-feira' },
        { value: 3, label: 'Quinta-feira' },
        { value: 4, label: 'Sexta-feira' },
        { value: 5, label: 'Sábado' },
        { value: 6, label: 'Domingo' },
    ];
    
    const monthOptions = [
        { value: 'all', label: 'Todos os Meses'},
        { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
    ];

    useEffect(() => {
        Promise.all([
            apiClient.get('/statistics/unique-crime-types'),
            apiClient.get('/statistics/unique-years') 
        ]).then(([crimeTypesRes, yearsRes]) => {
            setCrimeTypeOptions(crimeTypesRes.data);
            setYearOptions(yearsRes.data);
        }).catch(err => console.error("Falha ao carregar opções de filtro", err));
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = {};
        
        if (bairroFilter) params.bairro = bairroFilter;
        if (hourFilter !== 'all') params.hora = parseInt(hourFilter, 10);
        if (crimeTypeFilter) params.tipo_crime = crimeTypeFilter;
        if (dayOfWeekFilter !== 'all') params.dia_semana = parseInt(dayOfWeekFilter, 10);
        if (yearFilter !== 'all') params.ano = parseInt(yearFilter, 10);
        if (monthFilter !== 'all') params.mes = parseInt(monthFilter, 10);

        apiClient.get('/statistics/crime-heatmap-data', { params })
            .then(response => {
                setTableData(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [bairroFilter, hourFilter, crimeTypeFilter, dayOfWeekFilter, yearFilter, monthFilter]);

    const chartData = useMemo(() => {
        return tableData
            .slice(0, 15)
            .map(item => ({
                ...item,
                label: `${item.bairro} (${String(item.hora).padStart(2, '0')}h)`,
            }))
            .reverse();
    }, [tableData]);

    if (!crimeTypeOptions.length || !yearOptions.length) return <div className="loading">Carregando filtros...</div>;

    return(
        <div className="component-container">
            <h2>Hotspots de Crimes (Bairro vs. Hora)</h2>
            
            <div className="filters-grid">
                <input 
                    type="text" 
                    placeholder="Filtrar por bairro..." 
                    value={bairroFilter} 
                    onChange={(e) => setBairroFilter(e.target.value)}
                    className="filter-item"
                />
                <select value={crimeTypeFilter} onChange={(e) => setCrimeTypeFilter(e.target.value)} className="filter-item">
                    <option value="">Todos os Crimes</option>
                    {crimeTypeOptions.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="filter-item">
                    <option value="all">Todos os Anos</option>
                    {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
                <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="filter-item">
                    {monthOptions.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                </select>
                <select value={dayOfWeekFilter} onChange={(e) => setDayOfWeekFilter(e.target.value)} className="filter-item">
                    {dayOfWeekOptions.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                </select>
                <select value={hourFilter} onChange={(e) => setHourFilter(e.target.value)} className="filter-item">
                    <option value="all">Todas as Horas</option>
                    {[...Array(24).keys()].map(hour => (
                        <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>
                    ))}
                </select>
            </div>

            {loading ? <div className="loading">Gerando visualizações...</div> : tableData.length > 0 && (
                <div className="chart-container">
                    <h4>Top 15 Hotspots</h4>
                    <ResponsiveContainer>
                        <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="label" type="category" width={150} />
                            <Tooltip cursor={{fill: '#eee'}} />
                            <Legend />
                            <Bar dataKey="ocorrencias" name="Ocorrências" fill="#c1121f" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Bairro</th>
                            <th>Hora do Dia</th>
                            <th>Ocorrências</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3">Carregando dados...</td></tr>
                        ) : tableData.length > 0 ? (
                            tableData.map((item, index) => (
                                <tr key={`${item.bairro}-${item.hora}-${index}`}>
                                    <td>{item.bairro}</td>
                                    <td>{String(item.hora).padStart(2, '0')}:00</td>
                                    <td>{item.ocorrencias}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="3">Nenhum resultado encontrado para os filtros selecionados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CrimeHeatmapTable;