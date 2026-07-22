import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import parrafosData from './data/parrafos.json';
import { supabase } from './supabaseClient';
import './index.css';

function App() {
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: paragraphs, error } = await supabase
        .from('parrafos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      if (paragraphs && paragraphs.length > 0) {
        const mappedParagraphs = paragraphs.map(p => ({
          ...p,
          isCustom: p.is_custom
        }));
        setData(mappedParagraphs);
      } else {
        // Initial migration if table is empty
        console.log('Database empty. Migrating data from JSON...');
        const initialData = parrafosData.map(p => ({
          title: p.title,
          content: p.content,
          is_custom: p.isCustom || false
        }));
        
        const { data: insertedData, error: insertError } = await supabase
          .from('parrafos')
          .insert(initialData)
          .select();

        if (insertError) {
          console.error('Error inserting initial data:', insertError);
        } else if (insertedData) {
          const mapped = insertedData.map(p => ({
            ...p,
            isCustom: p.is_custom
          }));
          setData(mapped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        }
      }
    } catch (err) {
      console.error('Unexpected error during fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItem = async (updatedItem, originalTitle) => {
    const isExisting = data.some(item => item.title === originalTitle);
    
    // We update UI immediately for optimism
    let newData;
    if (isExisting) {
      newData = data.map(item => item.title === originalTitle ? updatedItem : item);
    } else {
      newData = [updatedItem, ...data];
    }
    setData(newData);
    setSelectedItem(updatedItem);

    try {
      if (updatedItem.id) {
        // Update existing item
        const { error } = await supabase
          .from('parrafos')
          .update({
            title: updatedItem.title,
            content: updatedItem.content,
            is_custom: updatedItem.isCustom !== undefined ? updatedItem.isCustom : true,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedItem.id);
          
        if (error) console.error('Error updating item:', error);
      } else {
        // For new items created via handleAddNewItem
        const { data: inserted, error } = await supabase
          .from('parrafos')
          .insert([{
            title: updatedItem.title,
            content: updatedItem.content,
            is_custom: updatedItem.isCustom !== undefined ? updatedItem.isCustom : true
          }])
          .select()
          .single();
          
        if (error) {
          console.error('Error inserting item:', error);
        } else if (inserted) {
           // Update state with the DB record that has the true ID
           const mappedInserted = { ...inserted, isCustom: inserted.is_custom };
           setData(prev => prev.map(item => item.title === updatedItem.title ? mappedInserted : item));
           setSelectedItem(mappedInserted);
        }
      }
    } catch (err) {
      console.error('Error in save:', err);
    }
  };

  const handleAddNewItem = () => {
    const newItem = {
      title: `Nuevo Párrafo ${Date.now().toString().slice(-4)}`,
      content: '<p>Pega aquí el contenido desde Word...</p>',
      isCustom: true
    };
    
    // Add to local state so user can edit it. It won't have an ID until saved.
    setData([newItem, ...data]);
    setSelectedItem(newItem);
  };

  const handleDeleteItem = async (itemToDelete) => {
    // Update locally first
    const newData = data.filter(item => item !== itemToDelete);
    setData(newData);
    setSelectedItem(null);

    // If it has an ID, delete from DB
    if (itemToDelete.id) {
      try {
        const { error } = await supabase
          .from('parrafos')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) {
          console.error('Error deleting item:', error);
        }
      } catch (err) {
        console.error('Error in delete:', err);
      }
    }
  };

  return (
    <div className="app-container">
      {isLoading ? (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      ) : null}
      <Sidebar 
        data={data} 
        selectedItem={selectedItem} 
        onSelectItem={setSelectedItem} 
        onAddNewItem={handleAddNewItem}
      />
      <ContentArea item={selectedItem} onSave={handleSaveItem} onDelete={handleDeleteItem} />
    </div>
  );
}

export default App;
