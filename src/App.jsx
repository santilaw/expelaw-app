import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import parrafosData from './data/parrafos.json';
import './index.css';

// Versión de los datos fuente - cambiar este valor fuerza un re-sync con el JSON
const DATA_VERSION = '2';

function App() {
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const savedVersion = localStorage.getItem('parrafosDataVersion');
    const savedData = localStorage.getItem('parrafosData');

    if (savedVersion === DATA_VERSION && savedData) {
      const parsedSavedData = JSON.parse(savedData);
      // Sincronizar: mantener ediciones del usuario, pero eliminar lo que ya no existe en el fuente
      const sourceTitles = parrafosData.map(p => p.title);
      // Filtrar: solo mantener items cuyo título exista en el fuente
      const filteredSaved = parsedSavedData.filter(p => sourceTitles.includes(p.title));
      // Agregar nuevos items del fuente que no estén guardados
      const savedTitles = filteredSaved.map(p => p.title);
      const newItems = parrafosData.filter(p => !savedTitles.includes(p.title));
      
      const combinedData = [...filteredSaved, ...newItems];
      setData(combinedData);

      if (newItems.length > 0 || filteredSaved.length !== parsedSavedData.length) {
        localStorage.setItem('parrafosData', JSON.stringify(combinedData));
      }
    } else {
      // Primera vez o versión cambió: cargar datos frescos del JSON
      setData(parrafosData);
      localStorage.setItem('parrafosData', JSON.stringify(parrafosData));
      localStorage.setItem('parrafosDataVersion', DATA_VERSION);
    }
  }, []);

  const handleSaveItem = (updatedItem) => {
    const newData = data.map(item => item.title === updatedItem.title ? updatedItem : item);
    setData(newData);
    localStorage.setItem('parrafosData', JSON.stringify(newData));
    setSelectedItem(updatedItem);
  };

  const handleDeleteItem = (itemToDelete) => {
    const newData = data.filter(item => item !== itemToDelete);
    setData(newData);
    localStorage.setItem('parrafosData', JSON.stringify(newData));
    setSelectedItem(null);
  };

  return (
    <div className="app-container">
      <Sidebar 
        data={data} 
        selectedItem={selectedItem} 
        onSelectItem={setSelectedItem} 
      />
      <ContentArea item={selectedItem} onSave={handleSaveItem} onDelete={handleDeleteItem} />
    </div>
  );
}

export default App;
