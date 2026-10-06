import { useEffect, useState } from 'react';

// Definimos la estructura exacta que tiene nuestro archivo JSON
interface Elemento {
  id: number;
  nombre: string;
  estado: string;
}

function App() {
  const [datos, setDatos] = useState<Elemento[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    // Vite sirve la carpeta 'public' en la raíz de la web, 
    // así que podemos leer directamente el archivo de esta forma:
    fetch('/datos.json')
      .then((respuesta) => respuesta.json())
      .then((data: Elemento[]) => {
        setDatos(data);
        setCargando(false);
      })
      .catch((error) => {
        console.error("Error al cargar el archivo JSON local:", error);
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return <p style={{ padding: '20px', fontFamily: 'Arial' }}>Cargando datos locales...</p>;
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#2c3e50' }}>Proyecto: Procesos de Software</h1>
      <h3 style={{ color: '#7f8c8d' }}>Datos leídos localmente desde el archivo JSON:</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#34495e', color: '#fff', textAlign: 'left' }}>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>Nombre del Elemento</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px', border: '1px solid #ddd', color: '#333' }}>{item.id}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', color: '#333' }}>{item.nombre}</td>
              <td style={{ 
                padding: '12px', 
                border: '1px solid #ddd', 
                fontWeight: 'bold', 
                color: item.estado === 'Activo' ? '#27ae60' : '#e67e22' 
              }}>
                {item.estado}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

