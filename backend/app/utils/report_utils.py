import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT


TUMOR_INFO = {
    "Glioma": {
        "description": "Glioma is a type of tumor that occurs in the brain and spinal cord. Gliomas begin in the glial cells that surround and support nerve cells.",
        "characteristics": "Fast-growing, can be malignant",
        "common_location": "Cerebral hemispheres",
    },
    "Meningioma": {
        "description": "Meningioma is a tumor that arises from the meninges — the membranes that surround the brain and spinal cord.",
        "characteristics": "Typically slow-growing, usually benign",
        "common_location": "Surface of the brain or spinal cord",
    },
    "Pituitary": {
        "description": "Pituitary tumors are abnormal growths that develop in the pituitary gland, which regulates important body functions and hormones.",
        "characteristics": "Usually benign (adenomas), affects hormone production",
        "common_location": "Pituitary gland (base of brain)",
    },
    "No Tumor": {
        "description": "No tumor detected. The MRI scan appears to show normal brain tissue with no visible tumor formations.",
        "characteristics": "Normal brain structure",
        "common_location": "N/A",
    },
}


def generate_prediction_report(prediction_data: dict, user_data: dict) -> bytes:
    """Generate a PDF report for a brain tumor prediction."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    elements = []

    # Header style
    header_style = ParagraphStyle(
        "Header",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6,
        alignment=TA_CENTER,
    )
    sub_header_style = ParagraphStyle(
        "SubHeader",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#4a5568"),
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#2d3748"),
        spaceBefore=12,
        spaceAfter=6,
        borderPad=4,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#4a5568"),
        spaceAfter=4,
        leading=16,
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#e53e3e"),
        spaceAfter=4,
        leading=12,
        alignment=TA_CENTER,
    )

    # Title
    elements.append(Paragraph("BrainVision", header_style))
    elements.append(Paragraph("Automated Brain Tumor MRI Analysis Report", sub_header_style))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", sub_header_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#6c63ff"), spaceAfter=12))

    # Patient / User info
    elements.append(Paragraph("Patient Information", section_style))
    patient_data = [
        ["Name:", user_data.get("full_name") or user_data.get("username", "N/A")],
        ["Username:", user_data.get("username", "N/A")],
        ["Report ID:", prediction_data.get("id", "N/A")],
        ["Scan Date:", prediction_data.get("created_at", datetime.utcnow().strftime("%Y-%m-%d %H:%M"))],
    ]
    patient_table = Table(patient_data, colWidths=[1.5 * inch, 5 * inch])
    patient_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#2d3748")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#4a5568")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(patient_table)
    elements.append(Spacer(1, 0.1 * inch))

    # Analysis Results
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=8))
    elements.append(Paragraph("Analysis Results", section_style))

    predicted_class = prediction_data.get("predicted_class", "Unknown")
    confidence = prediction_data.get("confidence", 0) * 100

    result_color = colors.HexColor("#c53030") if predicted_class != "No Tumor" else colors.HexColor("#276749")
    result_style = ParagraphStyle(
        "Result",
        parent=styles["Normal"],
        fontSize=18,
        textColor=result_color,
        alignment=TA_CENTER,
        spaceBefore=8,
        spaceAfter=4,
        fontName="Helvetica-Bold",
    )
    elements.append(Paragraph(f"Detected: {predicted_class}", result_style))
    elements.append(Paragraph(f"Confidence: {confidence:.1f}%", sub_header_style))
    elements.append(Spacer(1, 0.1 * inch))

    # Confidence breakdown
    all_confidences = prediction_data.get("all_confidences", {})
    if all_confidences:
        elements.append(Paragraph("Classification Confidence Breakdown", section_style))
        conf_data = [["Tumor Class", "Confidence (%)"]]
        for cls, conf in sorted(all_confidences.items(), key=lambda x: x[1], reverse=True):
            conf_data.append([cls, f"{conf * 100:.2f}%"])
        conf_table = Table(conf_data, colWidths=[3 * inch, 2 * inch])
        conf_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6c63ff")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f7fafc"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(conf_table)
        elements.append(Spacer(1, 0.1 * inch))

    # Medical context
    tumor_info = TUMOR_INFO.get(predicted_class, {})
    if tumor_info:
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=8))
        elements.append(Paragraph("Medical Context", section_style))
        elements.append(Paragraph(f"<b>Description:</b> {tumor_info['description']}", body_style))
        elements.append(Paragraph(f"<b>Characteristics:</b> {tumor_info['characteristics']}", body_style))
        elements.append(Paragraph(f"<b>Common Location:</b> {tumor_info['common_location']}", body_style))

    # Model info
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=8))
    elements.append(Paragraph("Model Information", section_style))
    model_data = [
        ["Model:", prediction_data.get("model_version", "InceptionV3-v1")],
        ["Image:", prediction_data.get("image_filename", "N/A")],
        ["Processing Time:", f"{prediction_data.get('processing_time_ms', 0):.0f} ms"],
    ]
    model_table = Table(model_data, colWidths=[1.5 * inch, 5 * inch])
    model_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#2d3748")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(model_table)

    # Disclaimer
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=8))
    elements.append(Paragraph(
        "⚠ IMPORTANT DISCLAIMER: This report is generated by an AI system and is intended for research "
        "and educational purposes only. It should NOT be used as a substitute for professional medical "
        "diagnosis. Always consult a qualified healthcare professional for medical advice.",
        disclaimer_style,
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
