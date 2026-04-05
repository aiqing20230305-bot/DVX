import React from 'react'
import { ParsedData, StoryboardAnalysisResult } from '../../types/index.js'
import { VideoAnalysis } from './VideoAnalysis.js'

interface ParsePreviewProps {
  data: ParsedData
}

export function ParsePreview({ data }: ParsePreviewProps) {
  if (data.type === 'video_analysis') {
    return <VideoAnalysis data={data} />
  }

  if (data.type === 'excel') {
    const storyboards = (data as ParsedData & { storyboards?: StoryboardAnalysisResult[] }).storyboards
    return (
      <div className="p-4 space-y-4">
        {data.sheets.slice(0, 2).map((sheet) => (
          <div key={sheet.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">工作表：{sheet.name}</span>
              <span className="text-xs text-slate-600">{sheet.summary.rowCount} 行 × {sheet.summary.columnCount} 列</span>
            </div>

            {/* Table */}
            {sheet.headers.length > 0 && sheet.rows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-slate-900">
                      {sheet.headers.slice(0, 8).map(h => (
                        <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap border-b border-slate-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                        {sheet.headers.slice(0, 8).map(h => (
                          <td key={h} className="px-3 py-1.5 text-slate-300 whitespace-nowrap max-w-32 truncate">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Numeric stats */}
            {sheet.summary.numericColumns.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {sheet.summary.numericColumns.slice(0, 4).map(col => (
                  <div key={col.name} className="bg-slate-900 rounded-lg p-2.5">
                    <div className="text-xs text-slate-500 mb-1">{col.name}</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">均值 <span className="text-slate-200">{col.avg.toFixed(1)}</span></span>
                      <span className="text-slate-400">合计 <span className="text-indigo-300">{col.sum.toFixed(0)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Storyboard analysis from embedded images */}
        {storyboards && storyboards.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-indigo-400">分镜画面分析</span>
              <span className="text-xs text-slate-600">
                ({storyboards.reduce((sum, s) => sum + s.frameCount, 0)} 帧)
              </span>
            </div>
            {storyboards.map((sb, si) => (
              <div key={si} className="mb-3">
                <div className="text-xs text-slate-500 mb-2">来自: {sb.sheetName}</div>
                <div className="space-y-2">
                  {sb.frames.map((frame, fi) => (
                    <div
                      key={fi}
                      className="bg-slate-900 rounded-lg p-3 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-300">{frame.timestamp}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {frame.shotType}
                        </span>
                        {frame.productVisible && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400">
                            产品可见
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">{frame.scene}</p>
                      {frame.textOverlay && (
                        <p className="text-xs text-cyan-400">文字: {frame.textOverlay}</p>
                      )}
                      {frame.elements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {frame.elements.map((el, ei) => (
                            <span key={ei} className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                              {el}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (data.type === 'pdf') {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>估计页数：{data.pageEstimate}</span>
          <span>章节数：{data.sections.length}</span>
        </div>
        <div className="bg-slate-900 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">文档摘要</div>
          <p className="text-sm text-slate-300 leading-relaxed">{data.summary}</p>
        </div>
        {data.sections.slice(0, 3).map((section, i) => (
          <div key={i} className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs font-medium text-indigo-400 mb-1">{section.heading}</div>
            <p className="text-xs text-slate-400 line-clamp-3">{section.content}</p>
          </div>
        ))}
      </div>
    )
  }

  if (data.type === 'image') {
    return (
      <div className="p-4 space-y-3">
        <div className="bg-slate-900 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">图片摘要</div>
          <p className="text-sm text-slate-300">{data.summary}</p>
        </div>
        {data.extractedText && (
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">提取文字</div>
            <p className="text-xs text-slate-400 whitespace-pre-wrap">{data.extractedText.slice(0, 300)}</p>
          </div>
        )}
        {data.dataPoints.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {data.dataPoints.slice(0, 6).map((dp, i) => (
              <div key={i} className="bg-slate-900 rounded-lg p-2.5">
                <div className="text-xs text-slate-500">{dp.label}</div>
                <div className="text-sm text-slate-200 font-medium">{dp.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
