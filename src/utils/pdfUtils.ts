export const compressImagesToPdf = async (imageFiles: File[], maxSizeMB: number = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas to process images
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set A4 dimensions (595 x 842 points)
      const pageWidth = 595;
      const pageHeight = 842;
      canvas.width = pageWidth;
      canvas.height = pageHeight;

      const processedImages: string[] = [];
      let processedCount = 0;

      imageFiles.forEach((file, index) => {
        const img = new Image();
        img.onload = () => {
          // Clear canvas
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, pageWidth, pageHeight);

          // Calculate scaling to fit page
          const scaleW = (pageWidth - 40) / img.width;
          const scaleH = (pageHeight - 40) / img.height;
          const scale = Math.min(scaleW, scaleH, 1.0);

          const newWidth = img.width * scale;
          const newHeight = img.height * scale;
          const x = (pageWidth - newWidth) / 2;
          const y = (pageHeight - newHeight) / 2;

          ctx.drawImage(img, x, y, newWidth, newHeight);
          
          // Convert to base64 with compression
          const quality = 0.8;
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          processedImages[index] = dataUrl;
          processedCount++;

          if (processedCount === imageFiles.length) {
            // Create simple PDF-like structure (for demo - in production use proper PDF library)
            const pdfContent = this.createSimplePdf(processedImages);
            resolve(new Blob([pdfContent], { type: 'application/pdf' }));
          }
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${file.name}`));
        };

        img.src = URL.createObjectURL(file);
      });

      if (imageFiles.length === 0) {
        reject(new Error('No images provided'));
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Simple PDF creation (in production, use a proper PDF library like jsPDF)
function createSimplePdf(images: string[]): string {
  // This is a simplified approach - in production use jsPDF or similar
  const pdfHeader = '%PDF-1.4\n';
  const pdfContent = images.map((img, i) => `Image ${i + 1}: ${img.substring(0, 100)}...`).join('\n');
  return pdfHeader + pdfContent;
}