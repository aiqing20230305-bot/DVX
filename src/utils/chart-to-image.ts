import html2canvas from 'html2canvas'

/**
 * 将图表DOM元素转换为base64图片
 * @param chartElement 图表DOM元素
 * @param scale 渲染缩放比例（默认2，更高更清晰）
 * @returns base64图片字符串
 */
export async function chartToImage(
  chartElement: HTMLElement,
  scale: number = 2
): Promise<string> {
  const canvas = await html2canvas(chartElement, {
    scale,
    backgroundColor: '#1A1A1A', // 卡片背景色
    useCORS: true,
    logging: false,
    windowWidth: chartElement.scrollWidth,
    windowHeight: chartElement.scrollHeight
  })

  return canvas.toDataURL('image/png')
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
