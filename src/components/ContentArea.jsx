import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, FileText, Edit2, Save, X, Trash2 } from 'lucide-react';

export default function ContentArea({ item, onSave, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    setCopied(false);
    setIsEditing(false);
    if (item) setEditTitle(item.title);
  }, [item]);

  // Estilos base que Word entiende perfectamente
  const FONT = 'Arial, sans-serif';
  const SIZE = '11pt';
  const COLOR = 'black';
  const BASE_STYLE = `font-family: ${FONT}; font-size: ${SIZE}; color: ${COLOR};`;

  // Recorre el DOM y aplica estilos en línea a cada elemento para que Word los respete
  const applyWordStyles = (node) => {
    if (node.nodeType !== 1) return; // Solo elementos

    const tag = node.tagName.toLowerCase();

    switch (tag) {
      case 'p':
        node.setAttribute('style', `${BASE_STYLE} margin: 0; margin-bottom: 8pt; line-height: 1.15; mso-line-height-rule: exactly; text-align: justify;`);
        break;
      case 'table':
        node.setAttribute('border', '1');
        node.setAttribute('cellpadding', '4');
        node.setAttribute('cellspacing', '0');
        node.setAttribute('style', `${BASE_STYLE} border-collapse: collapse; width: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt;`);
        break;
      case 'td':
      case 'th':
        node.setAttribute('style', `${BASE_STYLE} border: 1px solid black; padding: 4px 6px; vertical-align: middle; ${tag === 'th' ? 'font-weight: bold; background-color: #f2f2f2;' : ''}`);
        break;
      case 'tr':
        // No style needed, but ensure it exists
        break;
      case 'ul':
        node.setAttribute('style', `${BASE_STYLE} margin-top: 0; margin-bottom: 8pt; padding-left: 36pt; list-style-type: disc;`);
        break;
      case 'ol':
        node.setAttribute('style', `${BASE_STYLE} margin-top: 0; margin-bottom: 8pt; padding-left: 36pt; list-style-type: decimal;`);
        break;
      case 'li':
        node.setAttribute('style', `${BASE_STYLE} margin-bottom: 4pt; line-height: 1.15; mso-list: l0 level1 lfo1;`);
        break;
      case 'strong':
      case 'b':
        node.setAttribute('style', `font-weight: bold; color: ${COLOR};`);
        break;
      case 'em':
      case 'i':
        node.setAttribute('style', `font-style: italic; color: ${COLOR};`);
        break;
      case 'h1':
      case 'h2':
      case 'h3':
        node.setAttribute('style', `${BASE_STYLE} font-weight: bold; margin: 0; margin-bottom: 8pt; line-height: 1.15;`);
        break;
      case 'a':
        node.setAttribute('style', `${BASE_STYLE} color: #0563C1; text-decoration: underline;`);
        break;
      case 'img':
        // Mantener las imágenes (pantallazos) al copiar
        node.setAttribute('style', 'max-width: 100%; height: auto;');
        break;
      default:
        node.setAttribute('style', `${BASE_STYLE}`);
        break;
    }

    // Recorrer hijos (usando spread para evitar problemas con nodos eliminados)
    [...node.childNodes].forEach(child => applyWordStyles(child));
  };

  const handleCopy = async () => {
    if (!item) return;
    try {
      // Crear un div temporal para manipular el HTML sin afectar la UI
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = item.content;

      // Aplicar estilos Word-compatible a cada elemento
      applyWordStyles(tempDiv);

      // Construir el HTML final con metadatos que Word necesita
      const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>
@page { mso-page-border-surround-header:no; mso-page-border-surround-footer:no; }
body { font-family: ${FONT}; font-size: ${SIZE}; color: ${COLOR}; }
table { border-collapse: collapse; }
td, th { border: 1px solid black; }
</style></head>
<body><!--StartFragment-->${tempDiv.innerHTML}<!--EndFragment--></body></html>`;

      const blobHtml = new Blob([wordHtml], { type: 'text/html' });

      // Texto plano como fallback
      const plainDiv = document.createElement('div');
      plainDiv.innerHTML = item.content;
      const blobText = new Blob([plainDiv.innerText], { type: 'text/plain' });

      await navigator.clipboard.write([new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      })]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      // Fallback: copiar solo texto
      const fallbackDiv = document.createElement('div');
      fallbackDiv.innerHTML = item.content;
      navigator.clipboard.writeText(fallbackDiv.innerText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSave = () => {
    if (editorRef.current && item) {
      onSave({ ...item, title: editTitle, content: editorRef.current.innerHTML }, item.title);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta sección de tu librería?")) {
      onDelete(item);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      // Limpiar basura inicial de Word (comentarios y namespaces)
      let clean = html.replace(/<!--[\s\S]*?-->/g, '')
                      .replace(/<o:p>\s*<\/o:p>/g, '')
                      .replace(/<o:p>([\s\S]*?)<\/o:p>/g, '$1')
                      .replace(/<\/?\w+:[^>]*>/g, ''); // Quita etiquetas como <w:sdt>

      const parser = new DOMParser();
      const doc = parser.parseFromString(clean, 'text/html');

      // Eliminar etiquetas no deseadas
      const unwanted = doc.querySelectorAll('style, script, meta, link, title, xml');
      unwanted.forEach(el => el.remove());

      // Limpiar atributos para dejar HTML semántico pero conservando estilos y estructura
      const allEls = doc.body.querySelectorAll('*');
      
      for (let i = allEls.length - 1; i >= 0; i--) {
        const el = allEls[i];
        // Conservar atributos clave para la estructura visual y tablas
        const keepAttrs = ['src', 'href', 'alt', 'rowspan', 'colspan', 'style', 'width', 'height', 'border', 'cellpadding', 'cellspacing', 'valign', 'align'];
        const attrsToRemove = [];
        
        for (let j = 0; j < el.attributes.length; j++) {
          if (!keepAttrs.includes(el.attributes[j].name.toLowerCase())) {
            attrsToRemove.push(el.attributes[j].name);
          }
        }
        
        attrsToRemove.forEach(a => el.removeAttribute(a));
        
        // Desenvolver (unwrap) spans vacíos o divs innecesarios que Word agrega (solo si no tienen estilo)
        if ((el.tagName === 'SPAN' || el.tagName === 'DIV') && el.attributes.length === 0) {
          const fragment = document.createDocumentFragment();
          while(el.firstChild) {
            fragment.appendChild(el.firstChild);
          }
          el.parentNode.replaceChild(fragment, el);
        }
      }

      document.execCommand('insertHTML', false, doc.body.innerHTML);
    } else if (text) {
      document.execCommand('insertText', false, text);
    }
  };

  if (!item) {
    return (
      <div className="main-content">
        <div className="welcome-screen">
          <FileText size={64} />
          <h2>Bienvenido a ExpeLaw</h2>
          <p>Selecciona un título en el menú lateral o usa la barra de búsqueda para encontrar un párrafo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="content-card" key={item.title}>
        <div className="content-header" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          {isEditing ? (
            <input 
              type="text" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              className="content-title"
              style={{ flex: 1, border: '2px solid var(--color-accent)', borderRadius: '4px', padding: '4px 8px', fontSize: '1.5rem', outline: 'none' }}
              placeholder="Título del párrafo"
            />
          ) : (
            <h2 className="content-title">{item.title}</h2>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            {isEditing ? (
              <>
                <button 
                  className="copy-btn" 
                  onClick={handleCancel}
                  style={{ backgroundColor: '#6b7280', boxShadow: '0 4px 10px rgba(107, 114, 128, 0.3)' }}
                >
                  <X size={18} /> Cancelar
                </button>
                <button 
                  className="copy-btn" 
                  onClick={handleSave}
                  style={{ backgroundColor: '#10B981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}
                >
                  <Save size={18} /> Guardar
                </button>
              </>
            ) : (
              <>
                <button 
                  className="copy-btn" 
                  onClick={handleDelete}
                  style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}
                  title="Eliminar de la librería"
                >
                  <Trash2 size={18} /> Eliminar
                </button>
                <button 
                  className="copy-btn" 
                  onClick={() => setIsEditing(true)}
                  style={{ backgroundColor: 'var(--color-secondary)', boxShadow: '0 4px 10px rgba(66, 109, 169, 0.3)' }}
                >
                  <Edit2 size={18} /> Editar
                </button>
                <button 
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                  title="Copiar al portapapeles"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? '¡Copiado!' : 'Copiar Párrafo'}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="content-body">
          {isEditing ? (
            <>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '6px', fontSize: '0.9rem' }}>
                <strong>Modo de edición activo.</strong> Haz clic en el texto para editarlo. Tus cambios se guardarán localmente en este navegador.
              </div>
              <div 
                ref={editorRef}
                className="paragraph-content html-content editing"
                contentEditable={true}
                suppressContentEditableWarning={true}
                dangerouslySetInnerHTML={{ __html: item.content }}
                onPaste={handlePaste}
                style={{ 
                  border: '2px dashed var(--color-accent)', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  outline: 'none', 
                  backgroundColor: '#fdfdfd',
                  minHeight: '200px'
                }}
              />
            </>
          ) : (
            <div 
              className="paragraph-content html-content"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
