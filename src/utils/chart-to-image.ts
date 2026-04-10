import html2canvas from 'html2canvas'

/**
 * 将图表DOM元素转换为base64图片
 * @param chartElement 图表DOM元素
 * @param scale 渲染缩放比例（默认3，支持高DPI投影）
 * @returns base64图片字符串
 */
export async function chartToImage(
  chartElement: HTMLElement,
  scale: number = 3
): Promise<string> {
  const canvas = await html2canvas(chartElement, {
    scale, // 3x scale支持Retina显示和投影
    backgroundColor: '#1A1A1A', // 卡片背景色
    useCORS: true,
    logging: false,
    allowTaint: true, // 允许跨域图片
    imageTimeout: 0, // 不限制图片加载时间
    windowWidth: chartElement.scrollWidth,
    windowHeight: chartElement.scrollHeight
  })

  // 使用最高质量PNG编码
  return canvas.toDataURL('image/png', 1.0)
}

/**
 * 创建隐藏的图表容器并渲染图表
 * @param chartComponent React组件JSX
 * @returns 图表DOM元素
 */
export function createHiddenChartContainer(width: number, height: number): HTMLDivElement {
  const container = document.createElement('div')
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.background = '#1A1A1A'
  document.body.appendChild(container)
  return container
}

/**
 * 清理隐藏的图表容器
 * @param container 容器DOM元素
 */
export function cleanupChartContainer(container: HTMLDivElement): void {
  if (container && container.parentNode) {
    document.body.removeChild(container)
  }
}
