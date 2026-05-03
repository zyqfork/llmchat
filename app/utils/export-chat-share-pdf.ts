/**
 * 将整页聊天预览 PNG（与「下载图片」同源）导出为多页 A4 PDF，仅在浏览器中动态加载 jspdf。
 * 说明：生成 PDF 使用 jspdf；pdfjs-dist 用于解析/渲染已有 PDF（如 pi-web-ui 附件），用途不同。
 */
export async function pngDataUrlToChatSharePdfBlob(
  pngDataUrl: string,
): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const props = pdf.getImageProperties(pngDataUrl);
  const imgWidth = pageWidth;
  const imgHeight = (props.height * imgWidth) / props.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(pngDataUrl, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(pngDataUrl, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output("blob");
}
