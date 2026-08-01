from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
import io
from num2words import num2words


def amount_in_words(amount: float) -> str:
    rupees = int(amount)
    paise = round((amount - rupees) * 100)
    words = num2words(rupees, lang="en_IN").replace(",", "").title()
    result = f"{words} Rupees"
    if paise > 0:
        result += f" and {num2words(paise, lang='en').title()} Paise"
    return result + " Only"


def generate_invoice_pdf(invoice_data: dict, business_info: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=18, spaceAfter=6)
    normal = styles["Normal"]
    elements = []

    business_name = business_info.get("business_name", "Business")
    elements.append(Paragraph(business_name, title_style))
    if business_info.get("business_address"):
        elements.append(Paragraph(business_info["business_address"], normal))
    if business_info.get("gstin"):
        elements.append(Paragraph(f"GSTIN: {business_info['gstin']}", normal))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("<b>TAX INVOICE</b>", ParagraphStyle("InvTitle", alignment=TA_CENTER, fontSize=14)))
    elements.append(Spacer(1, 10))

    customer = invoice_data.get("customer", {})
    info_data = [
        ["Invoice No:", invoice_data.get("invoice_number", ""), "Date:", str(invoice_data.get("invoice_date", ""))],
        ["Customer:", customer.get("name", ""), "Due Date:", str(invoice_data.get("due_date", ""))],
        ["GSTIN:", customer.get("gstin", "N/A"), "Place of Supply:", invoice_data.get("place_of_supply", "")],
    ]
    info_table = Table(info_data, colWidths=[80, 180, 80, 120])
    info_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    items = invoice_data.get("items", [])
    table_data = [["#", "Item", "HSN", "Qty", "Unit", "Rate", "GST%", "Amount"]]
    for idx, item in enumerate(items, 1):
        table_data.append([
            str(idx),
            item.get("item_name", ""),
            item.get("hsn_code", ""),
            str(item.get("quantity", "")),
            item.get("unit", ""),
            f"₹{float(item.get('unit_price', 0)):,.2f}",
            f"{float(item.get('gst_rate', 0))}%",
            f"₹{float(item.get('total_amount', 0)):,.2f}",
        ])

    item_table = Table(table_data, colWidths=[25, 120, 45, 35, 35, 55, 40, 65])
    item_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#475569")),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("ALIGN", (7, 1), (7, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 15))

    totals = [
        ["Subtotal:", f"₹{float(invoice_data.get('subtotal', 0)):,.2f}"],
        ["Discount:", f"₹{float(invoice_data.get('discount', 0)):,.2f}"],
        ["Taxable Amount:", f"₹{float(invoice_data.get('taxable_amount', 0)):,.2f}"],
        ["CGST:", f"₹{float(invoice_data.get('cgst_amount', 0)):,.2f}"],
        ["SGST:", f"₹{float(invoice_data.get('sgst_amount', 0)):,.2f}"],
        ["IGST:", f"₹{float(invoice_data.get('igst_amount', 0)):,.2f}"],
        ["Total GST:", f"₹{float(invoice_data.get('total_gst', 0)):,.2f}"],
        ["Grand Total:", f"₹{float(invoice_data.get('total_amount', 0)):,.2f}"],
    ]
    total_table = Table(totals, colWidths=[400, 100])
    total_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 10))

    total_amt = float(invoice_data.get("total_amount", 0))
    elements.append(Paragraph(f"<b>Amount in Words:</b> {amount_in_words(total_amt)}", normal))
    elements.append(Spacer(1, 15))

    if invoice_data.get("payment_terms"):
        elements.append(Paragraph(f"<b>Payment Terms:</b> {invoice_data['payment_terms']}", normal))
    if invoice_data.get("notes"):
        elements.append(Paragraph(f"<b>Notes:</b> {invoice_data['notes']}", normal))
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Thank you for your business!", ParagraphStyle("Footer", alignment=TA_CENTER, textColor=colors.grey)))

    doc.build(elements)
    return buffer.getvalue()
