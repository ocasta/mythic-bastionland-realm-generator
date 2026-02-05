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
  // Vintage decoration settings
  borderColor: [74, 55, 40],    // Sepia brown
  parchmentColor: [245, 230, 211], // #f5e6d3 - matches compass rose background
  borderOuter: 5,               // mm from page edge
  borderInner: 8,               // mm from page edge
  cornerOrnamentSize: 15,       // mm
  compassSize: 25,              // mm diameter
  compassPadding: 5,            // mm from border
};

// 8-point compass rose SVG (inline for PDF rendering)
const COMPASS_ROSE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Outer decorative circle -->
  <circle cx="50" cy="50" r="48" fill="none" stroke="#4a3728" stroke-width="1.5"/>
  <circle cx="50" cy="50" r="45" fill="#f5e6d3" stroke="#4a3728" stroke-width="0.5"/>

  <!-- Inner circle -->
  <circle cx="50" cy="50" r="8" fill="#4a3728"/>

  <!-- Cardinal points (N, E, S, W) - long points -->
  <polygon points="50,5 45,42 50,35 55,42" fill="#4a3728"/>
  <polygon points="95,50 58,45 65,50 58,55" fill="#4a3728"/>
  <polygon points="50,95 55,58 50,65 45,58" fill="#f5e6d3" stroke="#4a3728" stroke-width="0.5"/>
  <polygon points="5,50 42,55 35,50 42,45" fill="#f5e6d3" stroke="#4a3728" stroke-width="0.5"/>

  <!-- Intercardinal points (NE, SE, SW, NW) - short points -->
  <polygon points="82,18 57,43 52,48 48,44" fill="#4a3728"/>
  <polygon points="82,82 57,57 52,52 48,56" fill="#f5e6d3" stroke="#4a3728" stroke-width="0.5"/>
  <polygon points="18,82 43,57 48,52 52,56" fill="#f5e6d3" stroke="#4a3728" stroke-width="0.5"/>
  <polygon points="18,18 43,43 48,48 52,44" fill="#4a3728"/>

  <!-- Cardinal direction labels -->
  <text x="50" y="16" text-anchor="middle" font-family="serif" font-size="8" font-weight="bold" fill="#4a3728">N</text>
  <text x="88" y="53" text-anchor="middle" font-family="serif" font-size="7" fill="#4a3728">E</text>
  <text x="50" y="92" text-anchor="middle" font-family="serif" font-size="7" fill="#4a3728">S</text>
  <text x="12" y="53" text-anchor="middle" font-family="serif" font-size="7" fill="#4a3728">W</text>
</svg>
`;

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

  // Remove landmarks and myths, keep holdings with their labels
  // Find all circles that are feature markers and process their parent groups
  const allCircles = clonedSvg.querySelectorAll('circle');
  allCircles.forEach(circle => {
    const fillColor = circle.getAttribute('fill');
    const parent = circle.parentElement;

    // Skip if not a feature marker (no fill or parent is not a g element)
    if (!fillColor || !parent || parent.tagName !== 'g') return;

    // Remove landmarks (green #22c55e) and myths (purple #9333ea) entirely
    // Keep holdings (blue #2563eb and gold #fbbf24) with their labels
    if (fillColor === '#22c55e' || fillColor === '#9333ea') {
      parent.remove();
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
 * @param {string} backgroundColor - Background color for the canvas (default white)
 * @returns {Promise<HTMLCanvasElement>} The rendered canvas
 */
function renderSVGToCanvas(svgElement, scale = 2, backgroundColor = '#ffffff') {
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
      ctx.fillStyle = backgroundColor;
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
 * @param {string} options.backgroundColor - Background color for the canvas
 * @returns {Promise<HTMLCanvasElement>} The rendered canvas
 */
async function svgToCanvas(svgElement, { hideLabels = false, backgroundColor = '#ffffff' } = {}) {
  const clonedSvg = cloneSVGForExport(svgElement, hideLabels);
  await inlineImages(clonedSvg);
  fixComputedStyles(clonedSvg);
  return renderSVGToCanvas(clonedSvg, 2, backgroundColor);
}

/**
 * Adds a section of features to the PDF
 * @param {jsPDF} pdf - The PDF document
 * @param {string} title - Section title
 * @param {Array} items - Items to render
 * @param {Function} formatItem - Function to format each item (label, data) => string or string[]
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
    const result = formatItem(item, index);
    // Support both single string and array of strings (for multi-line items)
    const lines = Array.isArray(result) ? result : [result];
    lines.forEach((text, lineIndex) => {
      pdf.text(text, margin + 3 + (lineIndex > 0 ? 5 : 0), yPosition);
      yPosition += lineHeight;
    });
  });

  yPosition += sectionGap;
  return yPosition;
}

/**
 * Formats a holding into multiple lines of text
 */
function formatHoldingLines(holding, realm) {
  const label = getHoldingLabel(holding, realm.holdings);
  const lines = [`${label}: ${holding.name || 'Unknown'}`];

  // Add ruler name first (if present)
  if (holding.ruler) {
    lines.push(`Ruler: ${holding.ruler}`);
  }

  // Add non-None ruler details
  if (holding.rulerDetails && Array.isArray(holding.rulerDetails)) {
    holding.rulerDetails.forEach(detail => {
      if (detail.type !== 'None' && detail.name) {
        lines.push(`  ${detail.type}: ${detail.name}`);
      }
    });
  }

  // Add separator if there's ruler info and holding details
  const hasRulerInfo = holding.ruler || (holding.rulerDetails && holding.rulerDetails.some(d => d.type !== 'None' && d.name));
  const hasHoldingDetails = holding.details && holding.details.some(d => d.type !== 'None' && d.name);
  if (hasRulerInfo && hasHoldingDetails) {
    lines.push('---');
  }

  // Add non-None holding details
  if (holding.details && Array.isArray(holding.details)) {
    holding.details.forEach(detail => {
      if (detail.type !== 'None' && detail.name) {
        lines.push(`${detail.type}: ${detail.name}`);
      }
    });
  }

  return lines;
}

/**
 * Adds a section with heading and underline, then items in columns
 * @returns {number} The Y position after this section
 */
function addGridSection(pdf, title, items, formatItem, color, startY, margin, pageWidth, numColumns = 4) {
  if (!items || items.length === 0) {
    return startY;
  }

  const { lineHeight, sectionGap, sectionFontSize, contentFontSize, colors } = PDF_STYLES;
  let yPosition = startY;

  // Section title on the left
  pdf.setFontSize(sectionFontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...color);
  pdf.text(title, margin, yPosition);

  // Underline running full width
  yPosition += 1;
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight;

  // Calculate column positions
  const contentWidth = pageWidth - margin * 2;
  const columnWidth = contentWidth / numColumns;

  // Format all items
  const formattedItems = items.map((item, index) => {
    const result = formatItem(item, index);
    return Array.isArray(result) ? result : [result];
  });

  // Calculate heights for each item (number of lines)
  const itemHeights = formattedItems.map(lines => lines.length * lineHeight);

  // Distribute items into columns, trying to balance heights
  // Simple approach: fill columns left to right
  const columns = Array.from({ length: numColumns }, () => []);
  const columnHeights = Array(numColumns).fill(0);

  formattedItems.forEach((lines, index) => {
    // Find the column with minimum height
    let minCol = 0;
    for (let c = 1; c < numColumns; c++) {
      if (columnHeights[c] < columnHeights[minCol]) {
        minCol = c;
      }
    }
    columns[minCol].push({ lines, height: itemHeights[index] });
    columnHeights[minCol] += itemHeights[index] + lineHeight; // Add gap between items
  });

  // Find the maximum column height
  const maxColumnHeight = Math.max(...columnHeights);

  // Render each column
  pdf.setFontSize(contentFontSize);
  pdf.setTextColor(...colors.text);

  columns.forEach((columnItems, colIndex) => {
    const colX = margin + colIndex * columnWidth;
    let colY = yPosition;

    columnItems.forEach(({ lines }, itemIndex) => {
      lines.forEach((line, lineIndex) => {
        // Truncate long lines to fit in column
        const maxWidth = columnWidth - 2;
        let displayText = line;
        while (pdf.getTextWidth(displayText) > maxWidth && displayText.length > 3) {
          displayText = displayText.slice(0, -4) + '...';
        }

        // First line of each item: bold the label (e.g., "S:", "H1:", "L1:", "M1:")
        if (lineIndex === 0 && displayText.includes(':')) {
          const colonIndex = displayText.indexOf(':');
          const label = displayText.substring(0, colonIndex + 1);
          const rest = displayText.substring(colonIndex + 1);

          // Draw label in bold
          pdf.setFont('helvetica', 'bold');
          pdf.text(label, colX, colY);
          const labelWidth = pdf.getTextWidth(label);

          // Draw rest in normal
          pdf.setFont('helvetica', 'normal');
          pdf.text(rest, colX + labelWidth, colY);
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.text(displayText, colX, colY);
        }
        colY += lineHeight;
      });
      colY += lineHeight * 0.5; // Gap between items
    });
  });

  return yPosition + maxColumnHeight + sectionGap;
}

/**
 * Adds all resources (holdings, landmarks, myths) to page 2 in grid layout
 */
function addResourcesGridPage(pdf, realm, startY, margin, pageWidth) {
  const { colors } = PDF_STYLES;
  let yPosition = startY;

  // Holdings section (at top)
  if (realm.holdings && realm.holdings.length > 0) {
    // Sort holdings: Seat of Power first, then by index
    const sortedHoldings = [...realm.holdings].sort((a, b) => {
      if (a.isSeatOfPower && !b.isSeatOfPower) return -1;
      if (!a.isSeatOfPower && b.isSeatOfPower) return 1;
      return 0;
    });

    yPosition = addGridSection(
      pdf,
      'Holdings',
      sortedHoldings,
      (holding) => formatHoldingLines(holding, realm),
      colors.holdings,
      yPosition,
      margin,
      pageWidth,
      4  // 4 columns for holdings
    );
  }

  // Landmarks section (in middle)
  if (realm.landmarks && realm.landmarks.length > 0) {
    yPosition = addGridSection(
      pdf,
      'Landmarks',
      realm.landmarks,
      (landmark, index) => {
        const label = `L${index + 1}`;
        let text = `${label}: ${landmark.type || 'Unknown'}`;
        const lines = [text, `  ${landmark.name || 'Unknown'}`];
        if (landmark.seer) {
          lines.push(`  (${landmark.seer})`);
        }
        return lines;
      },
      colors.landmarks,
      yPosition,
      margin,
      pageWidth,
      4  // 4 columns for landmarks
    );
  }

  // Myths section (at bottom)
  if (realm.myths && realm.myths.length > 0) {
    yPosition = addGridSection(
      pdf,
      'Myths',
      realm.myths,
      (myth, index) => {
        const label = `M${index + 1}`;
        return `${label}: ${myth.name || 'Unknown'}`;
      },
      colors.myths,
      yPosition,
      margin,
      pageWidth,
      4  // 4 columns for myths
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
  pdf.text('Created by mmacphail/mythic-bastionland-realm-generator for use with Mythic Bastionland. It is not endorsed or affiliated with Mythic Bastionland or Bastionland Press.', pageWidth / 2, pageHeight - margin / 2, { align: 'center' });
}

/**
 * Draws a decorative corner ornament (L-shaped flourish with end caps)
 * @param {jsPDF} pdf - The PDF document
 * @param {number} x - X position of corner
 * @param {number} y - Y position of corner
 * @param {number} size - Size of the ornament arms
 * @param {number} xDir - X direction (-1 for left, 1 for right)
 * @param {number} yDir - Y direction (-1 for up, 1 for down)
 */
function drawCornerOrnament(pdf, x, y, size, xDir, yDir) {
  const { borderColor } = PDF_STYLES;
  pdf.setDrawColor(...borderColor);
  pdf.setLineWidth(0.8);

  // Main L-shape arms
  const armLength = size * 0.7;
  const capSize = 2;

  // Horizontal arm
  pdf.line(x, y, x + (armLength * xDir), y);
  // Vertical arm
  pdf.line(x, y, x, y + (armLength * yDir));

  // Decorative end caps (small perpendicular lines)
  pdf.setLineWidth(0.5);
  // Cap on horizontal arm
  pdf.line(
    x + (armLength * xDir),
    y - capSize,
    x + (armLength * xDir),
    y + capSize
  );
  // Cap on vertical arm
  pdf.line(
    x - capSize,
    y + (armLength * yDir),
    x + capSize,
    y + (armLength * yDir)
  );

  // Small decorative diamond at corner
  const diamondSize = 1.5;
  pdf.setFillColor(...borderColor);
  const diamondX = x + (3 * xDir);
  const diamondY = y + (3 * yDir);
  pdf.triangle(
    diamondX, diamondY - diamondSize,
    diamondX + diamondSize, diamondY,
    diamondX, diamondY + diamondSize,
    'F'
  );
  pdf.triangle(
    diamondX, diamondY - diamondSize,
    diamondX - diamondSize, diamondY,
    diamondX, diamondY + diamondSize,
    'F'
  );
}

/**
 * Fills the map area with a parchment background color
 * @param {jsPDF} pdf - The PDF document
 */
function fillParchmentBackground(pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { parchmentColor, borderOuter, margin } = PDF_STYLES;

  // Bottom margin to stay above footer
  const bottomOuter = margin;

  pdf.setFillColor(...parchmentColor);
  pdf.rect(borderOuter, borderOuter, pageWidth - borderOuter * 2, pageHeight - borderOuter - bottomOuter, 'F');
}

/**
 * Draws a decorative pattern between border lines with alternating filled segments
 * @param {jsPDF} pdf - The PDF document
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {boolean} isHorizontal - Whether this is a horizontal edge
 */
function drawBorderPattern(pdf, x1, y1, x2, y2, isHorizontal) {
  const { borderColor } = PDF_STYLES;
  const spacing = 3; // Space between pattern elements
  const halfHeight = 1.5; // Half the height of the pattern band

  pdf.setDrawColor(...borderColor);
  pdf.setFillColor(...borderColor);
  pdf.setLineWidth(0.2);

  if (isHorizontal) {
    const midY = (y1 + y2) / 2;
    const length = Math.abs(x2 - x1);
    const startX = Math.min(x1, x2);
    const count = Math.floor(length / spacing);

    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing;
      const nextX = x + spacing;

      // Draw diagonal lines
      pdf.line(x, midY - halfHeight, nextX, midY + halfHeight);
      pdf.line(x, midY + halfHeight, nextX, midY - halfHeight);

      // Fill alternating triangular segments
      if (i % 2 === 0) {
        // Fill top triangle
        pdf.triangle(
          x, midY - halfHeight,
          nextX, midY - halfHeight,
          x + spacing / 2, midY,
          'F'
        );
        // Fill bottom triangle
        pdf.triangle(
          x, midY + halfHeight,
          nextX, midY + halfHeight,
          x + spacing / 2, midY,
          'F'
        );
      } else {
        // Fill left triangle
        pdf.triangle(
          x, midY - halfHeight,
          x, midY + halfHeight,
          x + spacing / 2, midY,
          'F'
        );
        // Fill right triangle
        pdf.triangle(
          nextX, midY - halfHeight,
          nextX, midY + halfHeight,
          x + spacing / 2, midY,
          'F'
        );
      }
    }
  } else {
    const midX = (x1 + x2) / 2;
    const length = Math.abs(y2 - y1);
    const startY = Math.min(y1, y2);
    const count = Math.floor(length / spacing);

    for (let i = 0; i < count; i++) {
      const y = startY + i * spacing;
      const nextY = y + spacing;

      // Draw diagonal lines
      pdf.line(midX - halfHeight, y, midX + halfHeight, nextY);
      pdf.line(midX + halfHeight, y, midX - halfHeight, nextY);

      // Fill alternating triangular segments
      if (i % 2 === 0) {
        // Fill left triangle
        pdf.triangle(
          midX - halfHeight, y,
          midX - halfHeight, nextY,
          midX, y + spacing / 2,
          'F'
        );
        // Fill right triangle
        pdf.triangle(
          midX + halfHeight, y,
          midX + halfHeight, nextY,
          midX, y + spacing / 2,
          'F'
        );
      } else {
        // Fill top triangle
        pdf.triangle(
          midX - halfHeight, y,
          midX + halfHeight, y,
          midX, y + spacing / 2,
          'F'
        );
        // Fill bottom triangle
        pdf.triangle(
          midX - halfHeight, nextY,
          midX + halfHeight, nextY,
          midX, y + spacing / 2,
          'F'
        );
      }
    }
  }
}

/**
 * Draws a vintage double-line border with corner ornaments and pattern fill
 * @param {jsPDF} pdf - The PDF document
 */
function drawVintageBorder(pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { borderColor, borderOuter, borderInner, cornerOrnamentSize, margin } = PDF_STYLES;

  // Bottom margin needs to be larger to stay above the footer text
  const bottomOuter = margin;  // 10mm from bottom to clear footer
  const bottomInner = margin + 3;  // 13mm from bottom

  pdf.setDrawColor(...borderColor);

  // Draw pattern fill between borders first
  // Top edge
  drawBorderPattern(pdf, borderOuter + cornerOrnamentSize, borderOuter, pageWidth - borderOuter - cornerOrnamentSize, borderInner, true);
  // Bottom edge
  drawBorderPattern(pdf, borderOuter + cornerOrnamentSize, pageHeight - bottomOuter, pageWidth - borderOuter - cornerOrnamentSize, pageHeight - bottomInner, true);
  // Left edge
  drawBorderPattern(pdf, borderOuter, borderOuter + cornerOrnamentSize, borderInner, pageHeight - bottomOuter - cornerOrnamentSize, false);
  // Right edge
  drawBorderPattern(pdf, pageWidth - borderOuter, borderOuter + cornerOrnamentSize, pageWidth - borderInner, pageHeight - bottomOuter - cornerOrnamentSize, false);

  // Outer border (thicker)
  pdf.setLineWidth(0.5);
  pdf.rect(borderOuter, borderOuter, pageWidth - borderOuter * 2, pageHeight - borderOuter - bottomOuter);

  // Inner border (thinner)
  pdf.setLineWidth(0.3);
  pdf.rect(borderInner, borderInner, pageWidth - borderInner * 2, pageHeight - borderInner - bottomInner);

  // Corner ornaments
  // Top-left
  drawCornerOrnament(pdf, borderOuter, borderOuter, cornerOrnamentSize, 1, 1);
  // Top-right
  drawCornerOrnament(pdf, pageWidth - borderOuter, borderOuter, cornerOrnamentSize, -1, 1);
  // Bottom-left
  drawCornerOrnament(pdf, borderOuter, pageHeight - bottomOuter, cornerOrnamentSize, 1, -1);
  // Bottom-right
  drawCornerOrnament(pdf, pageWidth - borderOuter, pageHeight - bottomOuter, cornerOrnamentSize, -1, -1);
}

/**
 * Renders the compass rose SVG to a canvas
 * @returns {Promise<HTMLCanvasElement>} The rendered canvas
 */
async function renderCompassToCanvas() {
  const blob = new Blob([COMPASS_ROSE_SVG], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 200; // Higher resolution for quality
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
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
 * Adds a compass rose to the bottom-right corner of the PDF
 * @param {jsPDF} pdf - The PDF document
 */
async function addCompassRose(pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { compassSize, compassPadding, borderInner, margin } = PDF_STYLES;

  // Use adjusted bottom margin to stay above footer
  const bottomInner = margin + 3;

  try {
    const canvas = await renderCompassToCanvas();
    const imgData = canvas.toDataURL('image/png');

    // Position in bottom-right corner, inside the border
    const x = pageWidth - borderInner - compassPadding - compassSize;
    const y = pageHeight - bottomInner - compassPadding - compassSize;

    pdf.addImage(imgData, 'PNG', x, y, compassSize, compassSize);
  } catch (error) {
    console.warn('Failed to render compass rose:', error);
  }
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
 * @param {boolean} options.showMapDecorations - Whether to include vintage border and compass
 */
export async function generateGMPDF({ mapContainer, realm, showMapDecorations = true }) {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { margin, titleFontSize } = PDF_STYLES;

  // Page 1: Map only (full page, centered)

  // Fill parchment background first (if decorations enabled)
  if (showMapDecorations) {
    fillParchmentBackground(pdf);
  }

  pdf.setFontSize(titleFontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.text(realm.name || 'Unnamed Realm', pageWidth / 2, margin + 5, { align: 'center' });

  const contentTop = margin + 12;
  const contentHeight = pageHeight - contentTop - margin;
  const contentWidth = pageWidth - margin * 2;

  // Add map (centered on page)
  if (mapContainer) {
    const svgElement = mapContainer.querySelector('svg');
    if (svgElement) {
      try {
        const backgroundColor = showMapDecorations ? '#f5e6d3' : '#ffffff';
        const canvas = await svgToCanvas(svgElement, { backgroundColor });
        const imgData = canvas.toDataURL('image/png');
        const { imgWidth, imgHeight } = calculateMapDimensions(canvas, contentWidth, contentHeight);

        // Center map horizontally and vertically
        const xOffset = (pageWidth - imgWidth) / 2;
        const yOffset = contentTop + (contentHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error capturing hex map:', error);
      }
    }
  }

  // Add vintage decorations to page 1 (border + compass)
  if (showMapDecorations) {
    drawVintageBorder(pdf);
    await addCompassRose(pdf);
  }

  // Add footer to page 1
  addFooter(pdf);

  // Page 2: Holdings, Landmarks, Myths in grid layout
  pdf.addPage();

  // Title for page 2
  pdf.setFontSize(titleFontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${realm.name || 'Unnamed Realm'} - Resources`, pageWidth / 2, margin + 5, { align: 'center' });

  // Add all resources in grid layout
  addResourcesGridPage(pdf, realm, contentTop, margin, pageWidth);

  // Add vintage border to page 2 (no compass)
  if (showMapDecorations) {
    drawVintageBorder(pdf);
  }

  // Add footer to page 2
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
 * @param {boolean} options.showMapDecorations - Whether to include vintage border and compass
 */
export async function generatePlayerPDF({ mapContainer, realm, showMapDecorations = true }) {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { margin, titleFontSize } = PDF_STYLES;
  const contentWidth = pageWidth - margin * 2;

  // Fill parchment background first (if decorations enabled)
  if (showMapDecorations) {
    fillParchmentBackground(pdf);
  }

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
        const backgroundColor = showMapDecorations ? '#f5e6d3' : '#ffffff';
        const canvas = await svgToCanvas(svgElement, { hideLabels: true, backgroundColor });
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

  // Add vintage decorations (border + compass)
  if (showMapDecorations) {
    drawVintageBorder(pdf);
    await addCompassRose(pdf);
  }

  // Add footer
  addFooter(pdf);

  // Open PDF in new window
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

export default generateGMPDF;
