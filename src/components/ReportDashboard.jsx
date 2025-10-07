import React, { useState, useEffect } from 'react';
import apiClient from '../services/api.service';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportDashboard = () => {
    const [reportData, setReportData] = useState(null);
    const [modelsSummary, setModelsSummary] = useState(null); 
    const [detailedReports, setDetailedReports] = useState({}); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllReports = async () => {
            try {
                const summaryRes = await apiClient.get('/reports/summary');
                setReportData(summaryRes.data);

                const modelsRes = await apiClient.get('/reports/models-summary');
                const summary = modelsRes.data;
                setModelsSummary(summary);
                
                const detailPromises = summary.map(model => 
                    apiClient.get(`/reports/model/${model.report_file}`).then(res => ({
                        id: model.model_id, 
                        data: res.data
                    }))
                );

                const details = await Promise.all(detailPromises);
                const reportsObject = details.reduce((acc, report) => {
                    acc[report.id] = report.data;
                    return acc;
                }, {});

                setDetailedReports(reportsObject);

            } catch (err) {
                console.error("Falha ao carregar dados do relatório", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllReports();
    }, []);

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#e74c3c'];

    if (loading) return <p>Gerando dados do relatório...</p>;
    if (!reportData || !modelsSummary) return <p>Não foi possível carregar os dados. Verifique se o pipeline de treino foi executado.</p>;

    const renderMetricsTable = (metrics, isBinary = false) => {
        if (!isBinary) {
            const crimeNames = Object.keys(metrics).filter(key => key !== 'accuracy' && key !== 'macro avg' && key !== 'weighted avg' && key !== 'samples');
            
            // Note: Adicionamos a classe 'scrollable-metrics' para controle de impressão
            return (
                <div className="scrollable-metrics" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #444', padding: '10px' }}>
                    <table style={{width: '100%', textAlign: 'center', fontSize: '0.85rem'}}>
                        <thead>
                            <tr><th>Crime</th><th>Precisão</th><th>Recall</th><th>F1-Score</th></tr>
                        </thead>
                        <tbody>
                            {crimeNames.map(crime => (
                                <tr key={crime}>
                                    <td style={{ textAlign: 'left' }}>{crime}</td>
                                    <td>{metrics[crime].precision.toFixed(2)}</td>
                                    <td>{metrics[crime].recall.toFixed(2)}</td>
                                    <td>{metrics[crime]['f1-score'].toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td>**Macro Avg**</td>
                                <td>{metrics['macro avg'].precision.toFixed(2)}</td>
                                <td>{metrics['macro avg'].recall.toFixed(2)}</td>
                                <td>{metrics['macro avg']['f1-score'].toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            );
        }
        
        return (
            <table style={{width: '100%', textAlign: 'center'}}>
                <thead>
                    <tr><th>Métrica</th><th>Não Violento</th><th>Violento</th></tr>
                </thead>
                <tbody>
                    <tr><td>Precisão</td><td>{metrics.nao_violento.precision.toFixed(2)}</td><td>{metrics.violento.precision.toFixed(2)}</td></tr>
                    <tr><td>Recall</td><td>{metrics.nao_violento.recall.toFixed(2)}</td><td>{metrics.violento.recall.toFixed(2)}</td></tr>
                    <tr><td>F1-Score</td><td>{metrics.nao_violento['f1-score'].toFixed(2)}</td><td>{metrics.violento['f1-score'].toFixed(2)}</td></tr>
                </tbody>
            </table>
        );
    };

    return (
        <div id="report-content" style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0' }}>
            <style>{`
                /* Definição das classes de Grid para o modo de tela */
                .findings-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    align-items: center;
                }
                
                .metrics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    align-items: start;
                }

                /* Media query para responsividade em telas pequenas */
                @media (max-width: 900px) {
                    .findings-grid, .metrics-grid {
                        grid-template-columns: 1fr; /* Força layouts para coluna */
                    }
                }
                
                /* ------------------------------------------- */
                /* MODO IMPRESSÃO (@media print)               */
                /* ------------------------------------------- */
                @media print {
                    body * { visibility: hidden; }
                    #report-content, #report-content * { visibility: visible; }
                    #report-content { 
                        position: absolute; left: 0; top: 0; width: 100%; 
                        padding: 20px; 
                        color: black !important; 
                        background-color: white !important;
                    }
                    
                    /* Força todos os grids a empilharem na impressão */
                    .findings-grid, .metrics-grid {
                        display: block !important;
                        width: 100% !important;
                    }
                    
                    /* CORREÇÃO AQUI: Remove a rolagem e o limite de altura das tabelas */
                    .scrollable-metrics {
                        max-height: none !important;
                        overflow-y: visible !important;
                        /* Garante que o padding e borda não causem problemas */
                        border: none !important; 
                        padding: 0 !important;
                    }
                    
                    /* Força os gráficos a usarem a largura total na impressão */
                    .recharts-responsive-container {
                        width: 100% !important;
                        height: 300px !important; 
                        margin-bottom: 20px;
                    }

                    /* Ajustes de cores e estilos para impressão */
                    h2, h3, h4 { color: black !important; }
                    div, section, p, strong, li { color: black !important; background-color: white !important; }
                    .recharts-wrapper .recharts-text { fill: black !important; }
                    .recharts-wrapper .recharts-cartesian-axis-line { stroke: black !important; }
                    .recharts-wrapper .recharts-cartesian-grid-horizontal line, 
                    .recharts-wrapper .recharts-cartesian-grid-vertical line { stroke: #ccc !important; }
                    .recharts-surface { overflow: visible; }
                    .no-print { display: none !important; }
                }
            `}</style>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}} className="no-print">
                <h2 style={{ color: '#f9f9f9', marginTop: 0 }}>Relatório Geral de Análise Criminal</h2>
                <button onClick={() => window.print()} style={{backgroundColor: '#007bff'}}>Imprimir Relatório</button>
            </div>
            <hr style={{borderColor: '#444'}} className="no-print"/>

            <section style={{marginBottom: '2rem'}}>
                <h3>1. Principais Achados (Findings)</h3>
                <div className="findings-grid">
                    <div>
                        <h4 style={{textAlign: 'center'}}>Top 5 Crimes Mais Frequentes</h4>
                        <ResponsiveContainer width="100%" height={300}> 
                            <PieChart>
                                <Pie data={reportData.findings.top_crimes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {reportData.findings.top_crimes.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#2a2a2a'}} />
                                <Legend/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                     <div>
                        <h4 style={{textAlign: 'center'}}>Top 5 Bairros com Mais Ocorrências</h4>
                        <ResponsiveContainer width="100%" height={300}> 
                            <PieChart>
                                <Pie data={reportData.findings.top_bairros} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                     {reportData.findings.top_bairros.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#2a2a2a'}} />
                                <Legend/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div style={{marginTop: '2rem'}}>
                    <h4 style={{textAlign: 'center'}}>Sazonalidade Mensal das Ocorrências</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.findings.seasonality}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" /> 
                            <XAxis dataKey="mes" /> 
                            <YAxis />
                            <Tooltip contentStyle={{backgroundColor: '#2a2a2a', color: '#f0f0f0'}}/>
                            <Legend />
                            <Line type="monotone" dataKey="ocorrencias" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>
            
            <hr style={{borderColor: '#444'}}/>

            <section style={{marginBottom: '2rem', pageBreakBefore: 'always'}}>
                <h3>2. Métricas e Desempenho dos Modelos Supervisionados</h3>
                
                {modelsSummary.map((model) => {
                    const detailedReport = detailedReports[model.model_id];
                    if (!detailedReport) return null;

                    const isBinary = model.model_id === 'lightgbm_violence'; 

                    return (
                        <div key={model.model_id} style={{ 
                            marginBottom: '2rem', 
                            border: '1px solid #444', 
                            padding: '1.5rem', 
                            borderRadius: '4px',
                            backgroundColor: '#2a2a2a' 
                        }}>
                            <h4 style={{borderBottom: '1px solid #555', paddingBottom: '10px'}}>{model.name}</h4>
                            <p>Relatório gerado em: {detailedReport.training_date}</p>
                            
                            <div className="metrics-grid">
                                <div>
                                    <h5>Relatório de Classificação</h5>
                                    <p>Acurácia Geral: <strong>{(detailedReport.metrics.accuracy * 100).toFixed(2)}%</strong></p>
                                    {renderMetricsTable(detailedReport.metrics, isBinary)}
                                </div>
                                <div>
                                    <h5>Matriz de Confusão</h5>
                                    <img 
                                        src={`${apiClient.defaults.baseURL}${detailedReport.confusion_matrix_path}`} 
                                        alt={`Matriz de Confusão - ${model.name}`} 
                                        style={{width: '100%', maxWidth: '400px', border: '1px solid #444', marginTop: '10px'}}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>
            <hr style={{borderColor: '#444'}}/>

            <section>
                <h3>3. Limitações da Análise</h3>
                <ul style={{paddingLeft: '20px'}}>
                    {reportData.limitations.map((item, index) => <li key={index} style={{marginBottom: '0.5rem'}}>{item}</li>)}
                </ul>
            </section>
        </div>
    );
};

export default ReportDashboard;