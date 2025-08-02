import jsPDF from 'jspdf';

interface SymptomObject {
  name: string;
  [key: string]: unknown;
}

interface AiAnalysisObject {
  analysis?: string;
  diagnosis?: string;
  summary?: string;
  [key: string]: unknown;
}

interface HealthReport {
  id: string;
  condition: string;
  date: string;
  time?: string;
  status: string;
  riskLevel: string;
  confidence: number;
  summary: string;
  symptoms?: string | string[] | SymptomObject[];
  aiAnalysis?: string | AiAnalysisObject;
  recommendations?: string | string[];
  urgencyLevel?: string | number;
  createdAt?: string;
}

export const generateHealthReportPDF = (report: HealthReport): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12): number => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Helper function to get status color
  const getStatusColor = (status: string): [number, number, number] => {
    switch (status.toLowerCase()) {
      case 'normal': return [34, 197, 94]; // green
      case 'attention': return [251, 191, 36]; // yellow
      case 'urgent': return [239, 68, 68]; // red
      default: return [107, 114, 128]; // gray
    }
  };

  // Helper function to get risk color
  const getRiskColor = (risk: string): [number, number, number] => {
    switch (risk.toLowerCase()) {
      case 'low': return [34, 197, 94]; // green
      case 'medium': return [251, 191, 36]; // yellow
      case 'high': return [239, 68, 68]; // red
      default: return [107, 114, 128]; // gray
    }
  };



  // Helper function to convert AI analysis to formatted string
  const getAiAnalysisText = (aiAnalysis?: string | AiAnalysisObject): string => {
    if (!aiAnalysis) return 'No analysis available';
    if (typeof aiAnalysis === 'string') return aiAnalysis;
    
    // Handle structured AI analysis object
    if (typeof aiAnalysis === 'object' && aiAnalysis !== null) {
      let formattedText = '';
      
      if (aiAnalysis.analysis) {
        formattedText += `Analysis:\n${aiAnalysis.analysis}\n\n`;
      }
      
      if (aiAnalysis.diagnosis) {
        formattedText += `Diagnosis:\n${aiAnalysis.diagnosis}\n\n`;
      }
      
      if (aiAnalysis.summary) {
        formattedText += `Summary:\n${aiAnalysis.summary}\n\n`;
      }
      
      // If none of the expected fields exist, fall back to string representation
      if (!formattedText.trim()) {
        return JSON.stringify(aiAnalysis, null, 2);
      }
      
      return formattedText.trim();
    }
    
    return 'No analysis available';
  };

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55); // gray-800
  doc.text('Health Report', margin, yPosition);
  yPosition += 15;

  // Report ID and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(`Report ID: ${report.id}`, margin, yPosition);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 60, yPosition);
  yPosition += 15;

  // Divider line
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Condition Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55); // gray-800
  yPosition = addWrappedText(report.condition, margin, yPosition, pageWidth - 2 * margin, 18);
  yPosition += 15;

  // Status Overview Section with cards
  // Create a row of three cards for Status, Risk Level, and AI Confidence
  const cardWidth = (pageWidth - 2 * margin - 20) / 3; // Width for each card with spacing
  const statusCardHeight = 70;
  
  // Status Card
  doc.setDrawColor(229, 231, 235); // border color
  doc.setFillColor(255, 255, 255); // white background
  doc.roundedRect(margin, yPosition, cardWidth, statusCardHeight, 3, 3, 'FD');
  
  // Status Icon
  const statusColor = getStatusColor(report.status);
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.circle(margin + 15, yPosition + 15, 5, 'F');
  
  // Status Label
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text('Status', margin + 10, yPosition + 35);
  
  // Status Value
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(report.status, margin + 10, yPosition + 50);
  
  // Risk Level Card
  doc.setDrawColor(229, 231, 235); // border color
  doc.setFillColor(255, 255, 255); // white background
  doc.roundedRect(margin + cardWidth + 10, yPosition, cardWidth, statusCardHeight, 3, 3, 'FD');
  
  // Risk Level Icon
  const riskColor = getRiskColor(report.riskLevel);
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.circle(margin + cardWidth + 25, yPosition + 15, 5, 'F');
  
  // Risk Level Label
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text('Risk Level', margin + cardWidth + 20, yPosition + 35);
  
  // Risk Level Value
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(report.riskLevel, margin + cardWidth + 20, yPosition + 50);
  
  // AI Confidence Card
  doc.setDrawColor(229, 231, 235); // border color
  doc.setFillColor(255, 255, 255); // white background
  doc.roundedRect(margin + 2 * cardWidth + 20, yPosition, cardWidth, statusCardHeight, 3, 3, 'FD');
  
  // AI Confidence Icon
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.circle(margin + 2 * cardWidth + 35, yPosition + 15, 5, 'F');
  
  // AI Confidence Label
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text('AI Confidence', margin + 2 * cardWidth + 30, yPosition + 35);
  
  // AI Confidence Value
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`${report.confidence}%`, margin + 2 * cardWidth + 30, yPosition + 50);
  
  yPosition += statusCardHeight + 15;

  // Additional Report Details
  if (report.urgencyLevel) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text(`Urgency Level: ${report.urgencyLevel}`, margin, yPosition);
    yPosition += lineHeight;
  }

  // Date and Time
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text(`Date: ${report.date}${report.time ? ` at ${report.time}` : ''}`, margin, yPosition);
  yPosition += lineHeight + 10;

  // Summary Section
  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  // Draw card-like container
  doc.setDrawColor(229, 231, 235); // border color
  doc.setFillColor(255, 255, 255); // white background
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, 'FD'); // Initial height, will adjust later
  
  // Section header with icon-like circle
  doc.setFillColor(59, 130, 246); // blue-500 for summary icon
  doc.circle(margin + 5, yPosition + 10, 2.5, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Summary', margin + 15, yPosition + 10);
  yPosition += 25;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81); // gray-700 for better contrast
  
  // Calculate height before drawing text
  const summaryLines = doc.splitTextToSize(report.summary, pageWidth - 2 * margin - 10);
  const summaryHeight = summaryLines.length * lineHeight;
  
  // Draw text
  doc.text(summaryLines, margin + 5, yPosition);
  yPosition += summaryHeight + 5;
  
  // Adjust the card height based on content
  const summaryCardHeight = Math.max(30, summaryHeight + 30);
  doc.setDrawColor(229, 231, 235); // border color
  doc.setFillColor(255, 255, 255); // white background
  doc.roundedRect(margin, yPosition - summaryHeight - 25, pageWidth - 2 * margin, summaryCardHeight, 3, 3, 'D'); // Redraw just the border
  
  yPosition += 15;

  // Symptoms Section
  if (report.symptoms) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Draw card-like container
    doc.setDrawColor(229, 231, 235); // border color
    doc.setFillColor(255, 255, 255); // white background
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, 'FD'); // Initial height, will adjust later
    
    // Section header with icon-like circle
    doc.setFillColor(239, 68, 68); // red-600 for stethoscope icon
    doc.circle(margin + 5, yPosition + 10, 2.5, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Reported Symptoms', margin + 15, yPosition + 10);
    yPosition += 20;
    
    // Symptoms list with bullet points
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    
    // Get symptoms as array
    const symptomsArray = Array.isArray(report.symptoms) ? report.symptoms : [report.symptoms];
    
    if (symptomsArray.length > 0) {
      for (const symptom of symptomsArray) {
        // Draw gray background for each symptom
        doc.setFillColor(249, 250, 251); // gray-50
        doc.setDrawColor(229, 231, 235); // gray-200
        doc.roundedRect(margin + 5, yPosition, pageWidth - 2 * margin - 10, 15, 2, 2, 'FD');
        
        // Draw red dot
        doc.setFillColor(239, 68, 68); // red-500
        doc.circle(margin + 10, yPosition + 7.5, 1, 'F');
        
        // Symptom text
        const symptomText = typeof symptom === 'string' ? symptom : 
                          (symptom && typeof symptom === 'object' && 'name' in symptom) ? 
                          (symptom as SymptomObject).name : 'Unknown symptom';
        
        doc.setTextColor(55, 65, 81); // gray-700
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(symptomText, margin + 15, yPosition + 9);
        yPosition += 15;
      }
    } else {
      doc.setTextColor(75, 85, 99); // gray-600
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('No symptoms recorded', margin + 5, yPosition + 10);
      yPosition += 15;
    }
    
    // Adjust the card height based on content
    const cardHeight = Math.max(30, (symptomsArray.length * 15) + 25);
    doc.setDrawColor(229, 231, 235); // border color
    doc.setFillColor(255, 255, 255); // white background
    doc.roundedRect(margin, yPosition - cardHeight, pageWidth - 2 * margin, cardHeight, 3, 3, 'D'); // Redraw just the border
    
    yPosition += 10;
  }

  // AI Analysis Section
  if (report.aiAnalysis) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Draw card-like container
    doc.setDrawColor(229, 231, 235); // border color
    doc.setFillColor(255, 255, 255); // white background
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, 'FD'); // Initial height, will adjust later
    
    // Section header with icon-like circle
    doc.setFillColor(147, 51, 234); // purple-600 for brain icon
    doc.circle(margin + 5, yPosition + 10, 2.5, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('AI Analysis', margin + 15, yPosition + 10);
    yPosition += 25;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    
    let analysisHeight = 0;
    
    if (typeof report.aiAnalysis === 'object' && report.aiAnalysis !== null) {
      // Handle structured AI analysis object
      if (report.aiAnalysis.analysis) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // gray-800
        doc.setFontSize(12);
        doc.text('Analysis:', margin + 5, yPosition);
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81); // gray-700
        doc.setFontSize(11);
        yPosition = addWrappedText(report.aiAnalysis.analysis, margin + 5, yPosition, pageWidth - 2 * margin - 10, 11);
        yPosition += 10;
        analysisHeight += 20 + (doc.splitTextToSize(report.aiAnalysis.analysis, pageWidth - 2 * margin - 10).length * lineHeight);
      }
      
      if (report.aiAnalysis.diagnosis) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // gray-800
        doc.setFontSize(12);
        doc.text('Diagnosis:', margin + 5, yPosition);
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81); // gray-700
        doc.setFontSize(11);
        yPosition = addWrappedText(report.aiAnalysis.diagnosis, margin + 5, yPosition, pageWidth - 2 * margin - 10, 11);
        yPosition += 10;
        analysisHeight += 20 + (doc.splitTextToSize(report.aiAnalysis.diagnosis, pageWidth - 2 * margin - 10).length * lineHeight);
      }
      
      if (report.aiAnalysis.summary) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // gray-800
        doc.setFontSize(12);
        doc.text('Summary:', margin + 5, yPosition);
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81); // gray-700
        doc.setFontSize(11);
        yPosition = addWrappedText(report.aiAnalysis.summary, margin + 5, yPosition, pageWidth - 2 * margin - 10, 11);
        yPosition += 5;
        analysisHeight += 15 + (doc.splitTextToSize(report.aiAnalysis.summary, pageWidth - 2 * margin - 10).length * lineHeight);
      }
    } else {
      // Handle string or other formats
      doc.setTextColor(55, 65, 81); // gray-700
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(getAiAnalysisText(report.aiAnalysis), margin + 5, yPosition, pageWidth - 2 * margin - 10, 11);
      analysisHeight += (doc.splitTextToSize(getAiAnalysisText(report.aiAnalysis), pageWidth - 2 * margin - 10).length * lineHeight);
      yPosition += 5;
    }
    
    // Adjust the card height based on content
    const cardHeight = Math.max(30, analysisHeight + 25);
    doc.setDrawColor(229, 231, 235); // border color
    doc.setFillColor(255, 255, 255); // white background
    doc.roundedRect(margin, yPosition - cardHeight, pageWidth - 2 * margin, cardHeight, 3, 3, 'D'); // Redraw just the border
    
    yPosition += 15;
  }

  // Recommendations Section
  if (report.recommendations) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Draw card-like container
    doc.setDrawColor(229, 231, 235); // border color
    doc.setFillColor(255, 255, 255); // white background
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, 'FD'); // Initial height, will adjust later
    
    // Section header with icon-like circle
    doc.setFillColor(22, 163, 74); // green-600 for heart icon
    doc.circle(margin + 5, yPosition + 10, 2.5, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Recommendations', margin + 15, yPosition + 10);
    yPosition += 20;
    
    // Get recommendations as array
    const recommendationsArray = Array.isArray(report.recommendations) ? 
                               report.recommendations : 
                               [report.recommendations];
    
    let recommendationsHeight = 0;
    
    if (recommendationsArray.length > 0) {
      for (const recommendation of recommendationsArray) {
        // Calculate text dimensions first
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(recommendation, pageWidth - 2 * margin - 30);
        const itemHeight = Math.max(20, lines.length * lineHeight + 10);
        
        // Draw green background for each recommendation
        doc.setFillColor(240, 253, 244); // green-50
        doc.setDrawColor(187, 247, 208); // green-200
        doc.roundedRect(margin + 5, yPosition, pageWidth - 2 * margin - 10, itemHeight, 2, 2, 'FD');
        
        // Draw green checkmark circle
        doc.setFillColor(22, 163, 74); // green-600
        doc.circle(margin + 10, yPosition + 10, 2.5, 'F');
        
        // Add a checkmark-like symbol
        doc.setDrawColor(255, 255, 255); // white
        doc.setLineWidth(0.5);
        doc.line(margin + 9, yPosition + 10, margin + 10, yPosition + 11);
        doc.line(margin + 10, yPosition + 11, margin + 12, yPosition + 8);
        
        // Recommendation text - ensure it's drawn after the background
        doc.setTextColor(22, 101, 52); // green-800 for better contrast
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(lines, margin + 20, yPosition + 12);
        
        yPosition += itemHeight + 5;
        recommendationsHeight += itemHeight + 5;
      }
    } else {
      doc.setTextColor(75, 85, 99); // gray-600
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('No specific recommendations provided', margin + 5, yPosition + 10);
      yPosition += 15;
      recommendationsHeight += 15;
    }
    
    // Adjust the card height based on content
    const cardHeight = Math.max(30, recommendationsHeight + 20);
    doc.setDrawColor(229, 231, 235); // border color
    doc.setFillColor(255, 255, 255); // white background
    doc.roundedRect(margin, yPosition - recommendationsHeight - 20, pageWidth - 2 * margin, cardHeight, 3, 3, 'D'); // Redraw just the border
    
    yPosition += 15;
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175); // gray-400
  doc.text('This report is generated by DiagnoGenie AI and should not replace professional medical advice.', margin, footerY);
  doc.text('Page 1', pageWidth - margin - 30, footerY);

  // Save the PDF
  const fileName = `health-report-${report.date}-${report.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
};