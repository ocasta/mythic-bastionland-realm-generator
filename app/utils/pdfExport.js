import jsPDF from 'jspdf';
import { getHoldingLabel } from './featureLabels';

// PDF styling constants
const PDF_STYLES = {
  lineHeight: 4.5,
  sectionGap: 5,
  margin: 10,
  titleFontSize: 16,
  sectionFontSize: 10,
  contentFontSize: 9,
  footerFontSize: 8,
  colors: {
    holdings: [37, 99, 235],   // Blue
    landmarks: [34, 197, 94],  // Green
    myths: [147, 51, 234],     // Purple
    text: [0, 0, 0],
    footer: [128, 128, 128],   // Gray
  },
};

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
 * Clones an SVG element and optionally removes labels/barriers for player PDFs
 * @param {SVGElement} svgElement - The SVG to clone
 * @param {boolean} hideLabels - Whether to hide reference labels and barriers
 * @returns {SVGElement} The cloned and modified SVG
 */
function cloneSVGForExport(svgElement, hideLabels) {
  const clonedSvg = svgElement.cloneNode(true);

  if (!hideLabels) {
    return clonedSvg;
  }

  // Remove all feature name labels
  const nameLabelsGroup = clonedSvg.querySelector('g.feature-name-labels');
  if (nameLabelsGroup) {
    nameLabelsGroup.remove();
  }

  // Remove barriers (red lines on hex edges)
  const barriersGroup = clonedSvg.querySelector('g.hex-barriers');
  if (barriersGroup) {
    barriersGroup.remove();
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

  return clonedSvg;
}

/**
 * Inlines all image elements in an SVG as data URLs
 * @param {SVGElement} svgElement - The SVG element to process
 */
async function inlineImages(svgElement) {
  const images = svgElement.querySelectorAll('image');

  for (const img of images) {
    const href = img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (href && !href.startsWith('data:')) {
      try {
        const absoluteUrl = new URL(href, window.location.origin).href;
        const dataUrl = await imageToDataURL(absoluteUrl);
        img.setAttribute('href', dataUrl);
        img.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      } catch (e) {
        console.warn('Failed to inline image:', href, e);
      }
    }
  }
}

/**
 * Fixes computed styles for SVG elements (e.g., currentColor)
 * @param {SVGElement} svgElement - The SVG element to process
 */
function fixComputedStyles(svgElement) {
  const elementsWithCurrentColor = svgElement.querySelectorAll('[stroke="currentColor"]');
  elementsWithCurrentColor.forEach(el => {
    el.setAttribute('stroke', '#4B5563'); // gray-600 equivalent
  });
}

/**
 * Renders a prepared SVG to a canvas
 * @param {SVGElement} svgElement - The SVG to render
 * @param {number} scale - Scale factor for resolution
 * @returns {Promise<HTMLCanvasElement>} The rendered canvas
 */
function renderSVGToCanvas(svgElement, scale = 2) {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
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
 * Converts an SVG element to a canvas by inlining all images
 * @param {SVGElement} svgElement - The SVG element to convert
 * @param {Object} options - Options for conversion
 * @param {boolean} options.hideLabels - Whether to hide reference labels (circles with text)
 * @returns {Promise<HTMLCanvasElement>} The rendered canvas
 */
async function svgToCanvas(svgElement, { hideLabels = false } = {}) {
  const clonedSvg = cloneSVGForExport(svgElement, hideLabels);
  await inlineImages(clonedSvg);
  fixComputedStyles(clonedSvg);
  return renderSVGToCanvas(clonedSvg);
}

/**
 * Adds a section of features to the PDF
 * @param {jsPDF} pdf - The PDF document
 * @param {string} title - Section title
 * @param {Array} items - Items to render
 * @param {Function} formatItem - Function to format each item (label, data) => string
 * @param {number[]} color - RGB color for the title
 * @param {number} startY - Starting Y position
 * @param {number} margin - Left margin
 * @returns {number} The new Y position after rendering
 */
function addFeatureSection(pdf, title, items, formatItem, color, startY, margin) {
  if (!items || items.length === 0) {
    return startY;
  }

  let yPosition = startY;
  const { lineHeight, sectionGap, sectionFontSize, contentFontSize, colors } = PDF_STYLES;

  // Section title
  pdf.setFontSize(sectionFontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...color);
  pdf.text(title, margin, yPosition);
  yPosition += lineHeight;

  // Section content
  pdf.setFontSize(contentFontSize);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.text);

  items.forEach((item, index) => {
    const text = formatItem(item, index);
    pdf.text(text, margin + 3, yPosition);
    yPosition += lineHeight;
  });

  yPosition += sectionGap;
  return yPosition;
}

/**
 * Adds the resources section to a GM PDF
 */
function addResourcesSection(pdf, realm, startY, margin) {
  const { colors } = PDF_STYLES;
  let yPosition = startY;

  // Holdings section
  if (realm.holdings && realm.holdings.length > 0) {
    // Sort holdings: Seat of Power first, then by index
    const sortedHoldings = [...realm.holdings].sort((a, b) => {
      if (a.isSeatOfPower && !b.isSeatOfPower) return -1;
      if (!a.isSeatOfPower && b.isSeatOfPower) return 1;
      return 0;
    });

    yPosition = addFeatureSection(
      pdf,
      'Holdings',
      sortedHoldings,
      (holding) => {
        const label = getHoldingLabel(holding, realm.holdings);
        return `${label}: ${holding.name || 'Unknown'}`;
      },
      colors.holdings,
      yPosition,
      margin
    );
  }

  // Landmarks section
  if (realm.landmarks && realm.landmarks.length > 0) {
    yPosition = addFeatureSection(
      pdf,
      'Landmarks',
      realm.landmarks,
      (landmark, index) => {
        const label = `L${index + 1}`;
        let text = `${label}: ${landmark.type || 'Unknown'} - ${landmark.name || 'Unknown'}`;
        if (landmark.seer) {
          text += ` (${landmark.seer})`;
        }
        return text;
      },
      colors.landmarks,
      yPosition,
      margin
    );
  }

  // Myths section
  if (realm.myths && realm.myths.length > 0) {
    yPosition = addFeatureSection(
      pdf,
      'Myths',
      realm.myths,
      (myth, index) => {
        const label = `M${index + 1}`;
        return `${label}: ${myth.name || 'Unknown'}`;
      },
      colors.myths,
      yPosition,
      margin
    );
  }

  return yPosition;
}

/**
 * Adds a footer to the PDF
 */
function addFooter(pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { margin, footerFontSize, colors } = PDF_STYLES;

  pdf.setFontSize(footerFontSize);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.footer);
  pdf.text('Created by mmacphail/mythic-bastionland-realm-generator', pageWidth / 2, pageHeight - margin / 2, { align: 'center' });
}

/**
 * Calculates map dimensions to fit within available space
 */
function calculateMapDimensions(canvas, maxWidth, maxHeight) {
  const imgAspectRatio = canvas.width / canvas.height;

  let imgWidth = maxWidth;
  let imgHeight = imgWidth / imgAspectRatio;

  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = imgHeight * imgAspectRatio;
  }

  return { imgWidth, imgHeight };
}

/**
 * Captures the hex map SVG and adds it to the PDF
 */
async function addMapToPDF(pdf, mapContainer, x, y, maxWidth, maxHeight, hideLabels = false) {
  if (!mapContainer) return null;

  const svgElement = mapContainer.querySelector('svg');
  if (!svgElement) return null;

  try {
    const canvas = await svgToCanvas(svgElement, { hideLabels });
    const imgData = canvas.toDataURL('image/png');
    const { imgWidth, imgHeight } = calculateMapDimensions(canvas, maxWidth, maxHeight);

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    return { imgWidth, imgHeight };
  } catch (error) {
    console.error('Error capturing hex map:', error);
    return null;
  }
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
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { margin, titleFontSize } = PDF_STYLES;

  // Title centered at top
  pdf.setFontSize(titleFontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.text(realm.name || 'Unnamed Realm', pageWidth / 2, margin + 5, { align: 'center' });

  const contentTop = margin + 12;
  const contentHeight = pageHeight - contentTop - margin;

  // Split page: map on left (75%), resources on right (25%)
  const mapWidth = (pageWidth - margin * 3) * 0.75;
  const resourcesX = margin + mapWidth + margin;

  // Add map (centered vertically in available space)
  if (mapContainer) {
    const svgElement = mapContainer.querySelector('svg');
    if (svgElement) {
      try {
        const canvas = await svgToCanvas(svgElement);
        const imgData = canvas.toDataURL('image/png');
        const { imgWidth, imgHeight } = calculateMapDimensions(canvas, mapWidth, contentHeight);

        // Center map vertically
        const yOffset = contentTop + (contentHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error capturing hex map:', error);
      }
    }
  }

  // Add Resources section on the right
  addResourcesSection(pdf, realm, contentTop, resourcesX);

  // Add footer
  addFooter(pdf);

  // Open PDF in new window
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
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
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { margin, titleFontSize } = PDF_STYLES;
  const contentWidth = pageWidth - margin * 2;

  // Title
  pdf.setFontSize(titleFontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.text(realm.name || 'Unnamed Realm', pageWidth / 2, margin + 5, { align: 'center' });

  const contentTop = margin + 12;
  const contentHeight = pageHeight - contentTop - margin;

  // Capture the hex map SVG as an image (without labels)
  if (mapContainer) {
    const svgElement = mapContainer.querySelector('svg');
    if (svgElement) {
      try {
        const canvas = await svgToCanvas(svgElement, { hideLabels: true });
        const imgData = canvas.toDataURL('image/png');
        const { imgWidth, imgHeight } = calculateMapDimensions(canvas, contentWidth, contentHeight);

        // Center the map
        const xOffset = (pageWidth - imgWidth) / 2;
        const yOffset = contentTop + (contentHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error capturing hex map:', error);
      }
    }
  }

  // Add footer
  addFooter(pdf);

  // Open PDF in new window
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

export default generateGMPDF;
