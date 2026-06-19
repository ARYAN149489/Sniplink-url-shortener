import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const RedirectHandler = () => {
  const { code } = useParams();

  useEffect(() => {
    // Determine backend host (localhost or Render production URL)
    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5002'
      : 'https://sniplink-backend-0xr5.onrender.com';

    // Perform redirect
    window.location.replace(`${backendUrl}/${code}`);
  }, [code]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      color: 'var(--text-secondary)'
    }}>
      <LoadingSpinner size="lg" />
      <p style={{ marginTop: 'var(--space-md)', fontSize: '1.1rem' }}>
        Redirecting you to your destination...
      </p>
    </div>
  );
};

export default RedirectHandler;
