/**
 * File Download Utility with Save As Dialog support
 * Uses File System Access API where available, falls back to regular download
 */

/**
 * Downloads a blob with a "Save As" dialog where supported
 * @param {Blob} blob - The file blob to download
 * @param {string} suggestedName - Suggested filename
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<boolean>} - True if saved successfully
 */
export const downloadWithSaveDialog = async (blob, suggestedName, mimeType = 'application/octet-stream') => {
  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      // Determine file extension and type
      const extension = suggestedName.split('.').pop().toLowerCase();
      const fileTypes = getFileTypes(extension, mimeType);
      
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: fileTypes,
      });
      
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      return true;
    } catch (err) {
      // User cancelled the dialog or API not available
      if (err.name === 'AbortError') {
        return false; // User cancelled
      }
      // Fall back to regular download
      console.warn('Save dialog failed, falling back to regular download:', err);
    }
  }
  
  // Fallback: Regular download
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', suggestedName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return true;
};

/**
 * Get file type configuration for Save dialog
 */
const getFileTypes = (extension, mimeType) => {
  const typeMap = {
    xlsx: {
      description: 'Excel Dosyası',
      accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
    },
    xls: {
      description: 'Excel Dosyası (Eski)',
      accept: { 'application/vnd.ms-excel': ['.xls'] }
    },
    zip: {
      description: 'ZIP Arşivi',
      accept: { 'application/zip': ['.zip'] }
    },
    pdf: {
      description: 'PDF Dosyası',
      accept: { 'application/pdf': ['.pdf'] }
    },
    png: {
      description: 'PNG Resim',
      accept: { 'image/png': ['.png'] }
    },
    jpg: {
      description: 'JPEG Resim',
      accept: { 'image/jpeg': ['.jpg', '.jpeg'] }
    }
  };
  
  if (typeMap[extension]) {
    return [typeMap[extension]];
  }
  
  return [{
    description: 'Dosya',
    accept: { [mimeType]: [`.${extension}`] }
  }];
};

/**
 * Download Excel file with Save As dialog
 * @param {Blob} blob - Excel file blob
 * @param {string} filename - Suggested filename
 */
export const downloadExcel = async (blob, filename) => {
  return downloadWithSaveDialog(
    blob, 
    filename, 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
};

/**
 * Download ZIP file with Save As dialog
 * @param {Blob} blob - ZIP file blob
 * @param {string} filename - Suggested filename
 */
export const downloadZip = async (blob, filename) => {
  return downloadWithSaveDialog(blob, filename, 'application/zip');
};

export default downloadWithSaveDialog;
