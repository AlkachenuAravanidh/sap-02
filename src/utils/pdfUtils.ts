import jsPDF from 'jspdf';

export const compressImagesToPdf = async (imageFiles: File[], maxSizeMB: number = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let processedCount = 0;
      const totalFiles = imageFiles.length;

      if (totalFiles === 0) {
        reject(new Error('No images provided'));
        return;
      }

      imageFiles.forEach((file, index) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Add new page for each image (except the first one)
            if (index > 0) {
              pdf.addPage();
            }

            // Calculate dimensions to fit A4 page with margins
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            // Calculate scaling to maintain aspect ratio
            const imgAspectRatio = img.width / img.height;
            let imgWidth = maxWidth;
            let imgHeight = maxWidth / imgAspectRatio;

            if (imgHeight > maxHeight) {
              imgHeight = maxHeight;
              imgWidth = maxHeight * imgAspectRatio;
            }

            // Center the image on the page
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            // Add image to PDF
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imgData = canvas.toDataURL('image/jpeg', 0.8);
              pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
            }

            processedCount++;

            if (processedCount === totalFiles) {
              // Generate PDF blob
              const pdfBlob = pdf.output('blob');
              
              // Check size and compress if needed
              if (pdfBlob.size > maxSizeMB * 1024 * 1024) {
                // Create a new PDF with lower quality
                const compressedPdf = new jsPDF('p', 'mm', 'a4');
                
                imageFiles.forEach((file, idx) => {
                  if (idx > 0) compressedPdf.addPage();
                  
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = img.width * 0.7; // Reduce resolution
                  canvas.height = img.height * 0.7;
                  
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imgData = canvas.toDataURL('image/jpeg', 0.6); // Lower quality
                    compressedPdf.addImage(imgData, 'JPEG', x, y, imgWidth * 0.8, imgHeight * 0.8);
                  }
                });
                
                resolve(compressedPdf.output('blob'));
              } else {
                resolve(pdfBlob);
              }
            }
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${file.name}`));
        };

        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      reject(error);
    }
  });
};