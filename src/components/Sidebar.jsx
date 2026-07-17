import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Search, Scale, Plus } from 'lucide-react';

export default function Sidebar({ data, selectedItem, onSelectItem, onAddNewItem }) {
  const [isRootExpanded, setIsRootExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar por título o contenido (texto plano)
  const filteredData = data.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(term);
    // Buscar también dentro del contenido (strip HTML)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = item.content;
    const contentMatch = tempDiv.innerText.toLowerCase().includes(term);
    return titleMatch || contentMatch;
  });

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>
          <Scale size={24} color="var(--color-accent)" />
          ExpeLaw
        </h1>
        <button 
          onClick={onAddNewItem}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            backgroundColor: 'var(--color-accent)', color: 'white',
            border: 'none', borderRadius: '4px', padding: '6px 10px',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title="Añadir nuevo párrafo"
        >
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            placeholder="Buscar párrafo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="search-clear" 
              onClick={() => setSearchTerm('')}
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="search-results-count">
            {filteredData.length} resultado{filteredData.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="sidebar-content">
        <ul className="tree-node">
          <li>
            <div 
              className="tree-item" 
              onClick={() => setIsRootExpanded(!isRootExpanded)}
            >
              {isRootExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              {isRootExpanded ? <FolderOpen size={20} color="var(--color-secondary)" /> : <Folder size={20} color="var(--color-secondary)" />}
              <span className="item-text" style={{ fontWeight: 600 }}>Párrafos</span>
            </div>
            
            {isRootExpanded && (
              <ul className="tree-node" style={{ paddingLeft: '24px' }}>
                {filteredData.map((item, index) => (
                  <li key={index}>
                    <div 
                      className={`tree-item ${selectedItem === item ? 'active' : ''}`}
                      onClick={() => onSelectItem(item)}
                    >
                      <FileText size={16} color={selectedItem === item ? 'var(--color-accent)' : 'var(--color-secondary)'} />
                      <span className="item-text" title={item.title}>{item.title}</span>
                    </div>
                  </li>
                ))}
                {searchTerm && filteredData.length === 0 && (
                  <li className="no-results">
                    No se encontraron párrafos
                  </li>
                )}
              </ul>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
