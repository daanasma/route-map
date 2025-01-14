export const useCorrectBasePath = () => {
  // Helper function to resolve the path dynamically based on environment
  const getFilePath = (file) => {
    const basePath = import.meta.env.BASE_URL; // Vite handles this, ensuring correct path
    return `${basePath}${file}`; // Append file to the base path
  };

  // Return the function to resolve the path
  return {
    getFilePath,
  };
};
