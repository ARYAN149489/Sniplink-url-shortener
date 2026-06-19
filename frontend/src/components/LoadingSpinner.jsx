const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClass = size === 'lg' ? 'spinner-lg' : '';
  return (
    <div className={`loading-container ${className}`}>
      <span className={`spinner ${sizeClass}`} />
    </div>
  );
};

export default LoadingSpinner;
