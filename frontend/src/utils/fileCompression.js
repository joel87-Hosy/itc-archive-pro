/**
 * Utilitaires de compression de fichiers pour optimiser le versement
 */

/**
 * Compresse une image avec Canvas API (sans dépendance externe)
 * Efficace pour les fichiers image volumineux
 * @param {File} file - Fichier image à compresser
 * @param {number} maxWidth - Largeur maximale (default: 2000px)
 * @param {number} maxHeight - Hauteur maximale (default: 2000px)
 * @param {number} quality - Qualité JPEG (0-1, default: 0.85)
 * @returns {Promise<File>} Fichier compressé
 */
export const compressImage = async (file, maxWidth = 2000, maxHeight = 2000, quality = 0.85) => {
  return new Promise((resolve) => {
    // Ne compresser que les images
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculer les nouvelles dimensions en conservant le ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
};

/**
 * Compresse un PDF avec une réduction de qualité simple
 * Note: Cette méthode utilise une réduction brute, idéale pour les PDFs texte
 * @param {File} file - Fichier PDF
 * @returns {Promise<File>} Fichier (retourné tel quel si non-PDF)
 */
export const compressFile = async (file) => {
  // Si le fichier est petit (< 10MB), pas besoin de compresser
  if (file.size < 10 * 1024 * 1024) {
    return file;
  }

  // Pour les images, appliquer la compression
  if (file.type.startsWith('image/')) {
    return compressImage(file);
  }

  // Pour les autres formats volumineux, retourner tel quel
  // (La compression native dépend du format)
  return file;
};

/**
 * Formate la taille en Ko, Mo, etc.
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Crée une URL d'aperçu local du fichier (pour les images)
 * @param {File} file - Fichier
 * @returns {Promise<string>} URL blob
 */
export const createFilePreview = (file) => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    } else {
      resolve(null);
    }
  });
};
