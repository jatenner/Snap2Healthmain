const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner; 