import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api.service';
import ForceGraph2D from 'react-force-graph-2d';

const getCommonPoints = (node1, node2) => {
    const common = [];
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    if (node1.hora !== null && node2.hora !== null && Math.abs(node1.hora - node2.hora) <= 2) {
        common.push(`Hora próxima (${node1.hora}h e ${node2.hora}h)`);
    }
    if (node1.arma_utilizada && node1.arma_utilizada === node2.arma_utilizada) {
        common.push(`Arma: ${node1.arma_utilizada}`);
    }
    if (node1.dia_semana !== null && node1.dia_semana === node2.dia_semana) {
        common.push(`Dia: ${dias[node1.dia_semana]}`);
    }
    return common;
};

const CrimeDetailsGrid = ({ node }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('pt-BR');
    };

    return (
        <div className="modal-grid">
            <div><strong>Data da Ocorrência</strong> {formatDate(node.data_ocorrencia)}</div>
            <div><strong>Bairro</strong> {node.bairro || 'N/A'}</div>
            <div><strong>Tipo de Crime</strong> {node.tipo_crime || 'N/A'}</div>
            <div><strong>Arma Utilizada</strong> {node.arma_utilizada || 'N/A'}</div>
            <div><strong>Nº de Vítimas</strong> {node.quantidade_vitimas ?? 'N/A'}</div>
            <div><strong>Nº de Suspeitos</strong> {node.quantidade_suspeitos ?? 'N/A'}</div>
            <div><strong>Sexo do Suspeito</strong> {node.sexo_suspeito || 'N/A'}</div>
            <div><strong>Idade do Suspeito</strong> {node.idade_suspeito || 'N/A'}</div>
            <div><strong>Órgão Responsável</strong> {node.orgao_responsavel || 'N/A'}</div>
            <div><strong>Status da Investigação</strong> {node.status_investigacao || 'N/A'}</div>
            <div style={{gridColumn: '1 / -1'}}><strong>Modus Operandi</strong> {node.descricao_modus_operandi || 'N/A'}</div>
        </div>
    );
};

const Modal = ({ data, onClose }) => {
    const [expandedNeighborId, setExpandedNeighborId] = useState(null);

    const handleNeighborClick = (nodeId) => {
        setExpandedNeighborId(prevId => (prevId === nodeId ? null : nodeId));
    };
    
    return (
        <React.Fragment>
            <style>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
                .modal-content { background: #1e1e1e; padding: 1.5rem 2rem; border-radius: 8px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; border: 1px solid #444; position: relative; }
                .modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #aaa; font-size: 1.5rem; cursor: pointer; }
                .modal-section { margin-bottom: 1.5rem; }
                .modal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; font-size: 0.9rem; margin-top: 1rem; }
                .modal-grid > div { background-color: #2a2a2a; padding: 10px; border-radius: 4px; }
                .modal-grid > div strong { color: #8884d8; display: block; margin-bottom: 4px; font-size: 0.8rem; text-transform: uppercase; }
                .modal-list { list-style: none; padding: 0; margin-top: 1rem; }
                .modal-list li { border-radius: 6px; background: #2a2a2a; margin-bottom: 1rem; cursor: pointer; transition: background-color 0.2s; }
                .modal-list li:hover { background-color: #3c3c3c; }
                .summary-view { padding: 1rem; }
                .summary-header { display: flex; justify-content: space-between; align-items: center; }
                .expand-icon { font-size: 1.2rem; color: #8884d8; transition: transform 0.2s; }
                .expanded-view { padding: 0 1rem 1rem 1rem; border-top: 1px solid #444; margin-top: 1rem; }
                .common-point { background-color: #8884d8; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; margin-right: 5px; display: inline-block; margin-top: 5px; }
            `}</style>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                    <div className="modal-section">
                        <h3 style={{marginTop: 0, color: '#f0f0f0'}}>Ocorrência Selecionada: <span style={{color: '#8884d8'}}>{data.clickedNode.label}</span></h3>
                        <CrimeDetailsGrid node={data.clickedNode} />
                    </div>
                    <hr style={{borderColor: '#444'}}/>
                    <div className="modal-section">
                        <h4 style={{color: '#f0f0f0'}}>Top 5 Crimes Similares</h4>
                        {data.neighbors.length > 0 ? (
                            <ul className="modal-list">
                                {data.neighbors.map(node => {
                                    const commonPoints = getCommonPoints(data.clickedNode, node);
                                    const isExpanded = expandedNeighborId === node.id;
                                    return (
                                        <li key={node.id} onClick={() => handleNeighborClick(node.id)}>
                                            <div className="summary-view">
                                                <div className="summary-header">
                                                    <strong>{node.label}</strong>
                                                    <span className="expand-icon" style={{transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
                                                </div>
                                                <p style={{fontSize: '0.9rem', margin: '8px 0', color: '#ccc'}}>Modus Operandi: {node.descricao_modus_operandi || 'N/A'}</p>
                                                <div style={{marginTop: '10px'}}>
                                                    {commonPoints.map(point => <span key={point} className="common-point">{point}</span>)}
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="expanded-view">
                                                     <CrimeDetailsGrid node={node} />
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (<p>Nenhum crime diretamente similar encontrado nesta rede.</p>)}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

const LoadingSpinner = () => (
    <React.Fragment>
        <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .spinner { border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid #8884d8; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Calculando similaridades...</p>
        </div>
    </React.Fragment>
);

const SimilarityNetwork = () => {
    const [bairroOptions, setBairroOptions] = useState([]);
    const [crimeTypeOptions, setCrimeTypeOptions] = useState([]);
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [graphMessage, setGraphMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedBairro, setSelectedBairro] = useState('');
    const [selectedCrime, setSelectedCrime] = useState('');
    const [modalData, setModalData] = useState(null);
    const graphContainerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 600 });

    useEffect(() => {
        if (graphContainerRef.current) {
            setDimensions({
                width: graphContainerRef.current.offsetWidth,
                height: 600
            });
        }
    }, [graphMessage]);

    useEffect(() => {
        apiClient.get('/statistics/unique-bairros')
            .then(res => {
                setBairroOptions(res.data);
                if (res.data.length > 0) setSelectedBairro(res.data[0]);
            })
            .catch(err => console.error("Falha ao carregar bairros", err));
        apiClient.get('/statistics/unique-crime-types')
            .then(res => setCrimeTypeOptions(res.data))
            .catch(err => console.error("Falha ao carregar tipos de crime", err));
    }, []);

    const handleNodeClick = (node) => {
        const directLinks = graphData.links.filter(l => l.source.id === node.id || l.target.id === node.id);
        
        const neighborsWithScore = directLinks.map(link => {
            const neighborId = link.source.id === node.id ? link.target.id : link.source.id;
            const neighborNode = graphData.nodes.find(n => n.id === neighborId);
            return { ...neighborNode, score: link.score || 0 };
        });

        const sortedNeighbors = neighborsWithScore.sort((a, b) => b.score - a.score).slice(0, 5);

        setModalData({ clickedNode: node, neighbors: sortedNeighbors });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBairro) {
            setError('Por favor, selecione um bairro para gerar a rede.');
            return;
        }
        setLoading(true);
        setError('');
        setGraphData({ nodes: [], links: [] });
        setGraphMessage('');

        const params = { bairro: selectedBairro };
        if (selectedCrime) {
            params.tipo_crime = selectedCrime;
        }

        try {
            const response = await apiClient.get('/analysis/similarity-network', { params });
            const { message, nodes, edges } = response.data;
            setGraphMessage(message);
            if (nodes && nodes.length > 0) {
                const links = edges.map(edge => ({ source: edge.from, target: edge.to, score: edge.score }));
                setGraphData({ nodes, links });
            }
        } catch (err) {
            setError('Falha ao gerar a rede. Verifique a API.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0' }}>
            {modalData && <Modal data={modalData} onClose={() => setModalData(null)} />}
            
            <h2 style={{ color: '#f9f9f9', marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' }}>Rede de Similaridade de Ocorrências</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '800px' }}>Visualize as conexões entre ocorrências similares. Clique em um nó para ver os detalhes e seus vizinhos.</p>

            <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc', flexGrow: 1 }}>
                    Bairro (Obrigatório):
                    <select value={selectedBairro} onChange={(e) => setSelectedBairro(e.target.value)} style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#f0f0f0', fontSize: '1rem' }}>
                        <option value="" disabled>Selecione um bairro</option>
                        {bairroOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc', flexGrow: 1 }}>
                    Tipo de Crime (Opcional):
                    <select value={selectedCrime} onChange={(e) => setSelectedCrime(e.target.value)} style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#f0f0f0', fontSize: '1rem' }}>
                        <option value="">Todos os Tipos</option>
                        {crimeTypeOptions.map(crime => <option key={crime} value={crime}>{crime}</option>)}
                    </select>
                </label>
                <button type="submit" disabled={loading || !selectedBairro} style={{ backgroundColor: loading ? '#555' : '#8884d8', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
                    {loading ? 'Gerando...' : 'Gerar Rede'}
                </button>
            </form>

            {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}

            {loading ? <LoadingSpinner /> : (
                graphMessage && (
                    <div style={{ border: '1px solid #444', borderRadius: '8px', background: '#111', marginTop: '1rem' }} ref={graphContainerRef}>
                        <p style={{textAlign: 'center', padding: '0.5rem', background: '#2a2a2a', margin: 0, borderBottom: '1px solid #444', borderTopLeftRadius: '8px', borderTopRightRadius: '8px'}}>{graphMessage}</p>
                        {graphData.nodes.length > 0 ? (
                            <ForceGraph2D
                                width={dimensions.width}
                                height={dimensions.height}
                                graphData={graphData}
                                nodeLabel="label"
                                nodeAutoColorBy="group"
                                backgroundColor="#111"
                                linkWidth={1}
                                linkColor={() => 'rgba(255, 255, 255, 0.2)'}
                                onNodeClick={handleNodeClick}
                            />
                        ) : (
                            <p style={{textAlign: 'center', padding: '2rem', color: '#aaa'}}>Nenhuma conexão de similaridade encontrada.</p>
                        )}
                    </div>
                )
            )}
        </div>
    );
};

export default SimilarityNetwork;

