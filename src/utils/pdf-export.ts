import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * 将报告HTML导出为PDF
 * @param reportHtml 报告HTML内容
 * @param filename PDF文件名
 */
export async function exportReportToPDF(reportHtml: string, filename: string): Promise<void> {
  // 1. 创建临时容器
  const container = document.createElement('div')
  container.innerHTML = reportHtml
  container.style.width = '210mm' // A4宽度
  container.style.padding = '20mm' // 页边距
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.background = '#0D0D0D' // 深色背景
  container.style.color = '#FFFFFF' // 白色文字
  document.body.appendChild(container)

  try {
    // 2. 使用html2canvas渲染HTML为canvas
    const canvas = await html2canvas(container, {
      scale: 1.5, // 提高清晰度（不要太高，否则文件过大）
      useCORS: true,
      backgroundColor: '#0D0D0D',
      logging: false,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight
    })

    // 3. 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // 4. 计算图片尺寸
    const imgWidth = 210 // A4宽度（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 5. 如果内容超过一页，需要分页
    const pageHeight = 297 // A4高度（mm）
    let heightLeft = imgHeight
    let position = 0

    // 将canvas转为JPEG图片（压缩更好）
    const imgData = canvas.toDataURL('image/jpeg', 0.8)

    // 添加第一页
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // 添加后续页面
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // 6. 保存PDF
    pdf.save(filename)
  } finally {
    // 7. 清理临时容器
    document.body.removeChild(container)
  }
}
