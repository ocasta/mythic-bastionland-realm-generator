import jsPDF from 'jspdf';

/**
 * Converts an image URL to a base64 data URL
 */
async function imageToDataURL(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Converts an SVG element to a canvas by inlining all images
 * @param {SVGElement} svgElement - The SVG element to convert
 * @param {Object} options - Options for conversion
 * @param {boolean} options.hideLabels - Whether to hide reference labels (circles with text)
 */
async function svgToCanvas(svgElement, { hideLabels = false } = {}) {
  // Clone the SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true);

  // Remove labels if requested (for player PDF)
  if (hideLabels) {
    // Remove all feature name labels
    const nameLabelsGroup = clonedSvg.querySelector('g.feature-name-labels');
    if (nameLabelsGroup) {
      nameLabelsGroup.remove();
    }

    // Remove all g elements that contain circles (these are the reference label groups)
    const labelGroups = clonedSvg.querySelectorAll('g.pointer-events-none');
    labelGroups.forEach(group => {
      const circle = group.querySelector('circle');
      if (circle) {
        const fillColor = circle.getAttribute('fill');
        // Blue circles (#2563eb) are regular holdings, gold (#d4af37) is Seat of Power - keep them but remove text
        if (fillColor === '#2563eb' || fillColor === '#d4af37') {
          // Remove the reference label text (S, H1, etc.)
          const texts = group.querySelectorAll(':scope > text');
          texts.forEach(text => text.remove());
        } else {
          // Remove landmarks (green) and myths (purple) entirely
          group.remove();
        }
      }
    });
  }

  // Get all image elements in patterns and inline them
  const images = clonedSvg.querySelectorAll('image');

  for (const img of images) {
    const href = img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (href && !href.startsWith('data:')) {
      try {
        // Convert relative URL to absolute
        const absoluteUrl = new URL(href, window.location.origin).href;
        const dataUrl = await imageToDataURL(absoluteUrl);
        img.setAttribute('href', dataUrl);
        img.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      } catch (e) {
        console.warn('Failed to inline image:', href, e);
      }
    }
  }

  // Handle computed styles for elements using currentColor
  const elementsWithCurrentColor = clonedSvg.querySelectorAll('[stroke="currentColor"]');
  elementsWithCurrentColor.forEach(el => {
    el.setAttribute('stroke', '#4B5563'); // gray-600 equivalent
  });

  // Serialize SVG to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);

  // Create blob and URL
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Create image from SVG
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Use higher resolution for better quality
      const scale = 2;
      canvas.width = svgElement.width.baseVal.value * scale;
      canvas.height = svgElement.height.baseVal.value * scale;

      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Generates a GM's PDF containing the hex map with labels and realm resources list.
 * Opens the PDF in a new browser window.
 *
 * @param {Object} options
 * @param {HTMLElement} options.mapContainer - The DOM element containing the HexMap
 * @param {Object} options.realm - The realm object with holdings, landmarks, myths
 */
export async function generateGMPDF({ mapContainer, realm }) {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(realm.name || 'Unnamed Realm', pageWidth / 2, margin + 5, { align: 'center' });

  let yPosition = margin + 12;

  // Count total resource items to estimate space needed
  const holdingsCount = realm.holdings?.length || 0;
  const landmarksCount = realm.landmarks?.length || 0;
  const mythsCount = realm.myths?.length || 0;
  const totalResources = holdingsCount + landmarksCount + mythsCount;

  // Estimate space needed for resources (header + items per section)
  const lineHeight = 4.5;
  const sectionHeaderHeight = 5;
  const sectionsCount = (holdingsCount > 0 ? 1 : 0) + (landmarksCount > 0 ? 1 : 0) + (mythsCount > 0 ? 1 : 0);
  const resourcesHeight = (totalResources * lineHeight) + (sectionsCount * sectionHeaderHeight) + 10;

  // Calculate available space for map
  const availableMapHeight = pageHeight - yPosition - margin - resourcesHeight;

  // Capture the hex map SVG as an image
  if (mapContainer) {
    const svgElement = mapContainer.querySelector('svg');
    if (svgElement) {
      try {
        const canvas = await svgToCanvas(svgElement);
        const imgData = canvas.toDataURL('image/png');
        const imgAspectRatio = canvas.width / canvas.height;

        // Calculate image dimensions to fit available space
        let imgWidth = contentWidth;
        let imgHeight = imgWidth / imgAspectRatio;

        if (imgHeight > availableMapHeight) {
          imgHeight = availableMapHeight;
          imgWidth = imgHeight * imgAspectRatio;
        }

        const xOffset = (pageWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 5;
      } catch (error) {
        console.error('Error capturing hex map:', error);
        yPosition += 5;
      }
    }
  }

  // Add Resources section
  addResourcesSectionCompact(pdf, realm, yPosition, margin, contentWidth);

  // Open PDF in new window
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

function addResourcesSectionCompact(pdf, realm, startY, margin, contentWidth) {
  let yPosition = startY;
  const lineHeight = 4.5;
  const sectionGap = 5;
  const colWidth = contentWidth / 3;

  // Holdings section
  if (realm.holdings && realm.holdings.length > 0) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235); // Blue
    pdf.text('Holdings', margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    // Sort holdings: Seat of Power first, then by index
    const sortedHoldings = [...realm.holdings].sort((a, b) => {
      if (a.isSeatOfPower && !b.isSeatOfPower) return -1;
      if (!a.isSeatOfPower && b.isSeatOfPower) return 1;
      return 0;
    });

    let holdingIndex = 1;
    sortedHoldings.forEach((holding) => {
      const label = holding.isSeatOfPower ? 'S' : `H${holdingIndex++}`;
      const text = `${label}: ${holding.name || 'Unknown'}`;
      pdf.text(text, margin + 3, yPosition);
      yPosition += lineHeight;
    });

    yPosition += sectionGap;
  }

  // Landmarks section
  if (realm.landmarks && realm.landmarks.length > 0) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(34, 197, 94); // Green
    pdf.text('Landmarks', margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    realm.landmarks.forEach((landmark, index) => {
      const label = `L${index + 1}`;
      let text = `${label}: ${landmark.type || 'Unknown'} - ${landmark.name || 'Unknown'}`;
      if (landmark.seer) {
        text += ` (${landmark.seer})`;
      }
      pdf.text(text, margin + 3, yPosition);
      yPosition += lineHeight;
    });

    yPosition += sectionGap;
  }

  // Myths section
  if (realm.myths && realm.myths.length > 0) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(147, 51, 234); // Purple
    pdf.text('Myths', margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    realm.myths.forEach((myth, index) => {
      const label = `M${index + 1}`;
      const text = `${label}: ${myth.name || 'Unknown'}`;
      pdf.text(text, margin + 3, yPosition);
      yPosition += lineHeight;
    });
  }

  return yPosition;
}

/**
 * Generates a Player's PDF containing just the hex map without labels or resources.
 * Opens the PDF in a new browser window.
 *
 * @param {Object} options
 * @param {HTMLElement} options.mapContainer - The DOM element containing the HexMap
 * @param {Object} options.realm - The realm object (used for name only)
 */
export async function generatePlayerPDF({ mapContainer, realm }) {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(realm.name || 'Unnamed Realm', pageWidth / 2, margin + 5, { align: 'center' });

  let yPosition = margin + 12;

  // Calculate available space for map (full page minus title and margins)
  const availableMapHeight = pageHeight - yPosition - margin;

  // Capture the hex map SVG as an image (without labels)
  if (mapContainer) {
    const svgElement = mapContainer.querySelector('svg');
    if (svgElement) {
      try {
        const canvas = await svgToCanvas(svgElement, { hideLabels: true });
        const imgData = canvas.toDataURL('image/png');
        const imgAspectRatio = canvas.width / canvas.height;

        // Calculate image dimensions to fit available space
        let imgWidth = contentWidth;
        let imgHeight = imgWidth / imgAspectRatio;

        if (imgHeight > availableMapHeight) {
          imgHeight = availableMapHeight;
          imgWidth = imgHeight * imgAspectRatio;
        }

        const xOffset = (pageWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yPosition, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error capturing hex map:', error);
      }
    }
  }

  // Open PDF in new window
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

export default generateGMPDF;
