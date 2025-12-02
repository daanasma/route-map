import { log } from '../debug/debug.js';

export const useCorrectBasePath = () => {
  // Helper function to resolve the path dynamically based on environment
  const getDataPath = (file) => {
    let basePath = import.meta.env.BASE_URL; // Vite handles this, ensuring correct path
    if (process.env.NODE_ENV !== 'production') {

      basePath += 'dist/'
      log("adding dist", basePath)
    }
    return `${basePath}${file}`; // Append file to the base path
  };

  // Return the function to resolve the path
  return {
    getFilePath: getDataPath,
  };
};
