import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, RefreshCw } from 'lucide-react'
import { Button } from '../shared/Button'
import { Product, getProducts, createProduct, updateProduct, deleteProduct, refreshProducts } from '../../api/product.api'

interface ProductManagementProps {
  projectId: string
}

interface ProductFormData {
  name: string
  alias: string
  description: string
}

export default function ProductManagement({ projectId }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    alias: '',
    description: ''
  })
  const [error, setError] = useState<string | null>(null)

  // 加载产品列表
  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts(projectId)
      setProducts(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [projectId])

  // 刷新产品列表
  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const data = await refreshProducts(projectId)
      setProducts(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || '刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  // 开始创建
  const startCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({ name: '', alias: '', description: '' })
    setError(null)
  }

  // 开始编辑
  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setIsCreating(false)
    setFormData({
      name: product.name,
      alias: product.alias || '',
      description: product.description || ''
    })
    setError(null)
  }

  // 取消编辑/创建
  const cancelForm = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({ name: '', alias: '', description: '' })
    setError(null)
  }

  // 保存产品
  const saveProduct = async () => {
    try {
      if (!formData.name.trim()) {
        setError('产品名称不能为空')
        return
      }

      if (editingId) {
        // 更新
        await updateProduct(projectId, editingId, {
          name: formData.name.trim(),
          alias: formData.alias.trim() || undefined,
          description: formData.description.trim() || undefined
        })
      } else {
        // 创建
        await createProduct(projectId, {
          name: formData.name.trim(),
          alias: formData.alias.trim() || undefined,
          description: formData.description.trim() || undefined
        })
      }

      await loadProducts()
      cancelForm()
    } catch (err: any) {
      setError(err.message || '保存失败')
    }
  }

  // 删除产品
  const handleDelete = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) {
      return
    }

    try {
      await deleteProduct(projectId, productId)
      await loadProducts()
    } catch (err: any) {
      setError(err.message || '删除失败')
    }
  }

  // 按来源分组
  const autoProducts = products.filter(p => p.source === 'auto_extracted')
  const manualProducts = products.filter(p => p.source === 'manual')

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{
          borderColor: 'var(--color-primary)',
          borderTopColor: 'transparent'
        }}></div>
        <p className="mt-2" style={{ color: 'var(--color-text-tertiary)' }}>加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>产品管理</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>刷新</span>
          </Button>
          {!isCreating && !editingId && (
            <Button
              variant="outline"
              size="sm"
              onClick={startCreate}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>添加产品</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-md" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '3px solid #ef4444'
        }}>
          <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="border rounded-lg p-4" style={{
          backgroundColor: 'var(--color-bg-elevated-2)',
          borderColor: 'var(--color-border)'
        }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {editingId ? '编辑产品' : '添加产品'}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                产品名称 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：多芬"
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                产品别名
              </label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                placeholder="例如：Dove"
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                产品描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="产品的详细描述..."
                rows={3}
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={cancelForm}>
                取消
              </Button>
              <Button size="sm" onClick={saveProduct}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-extracted Products */}
      {autoProducts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            自动提取的产品 ({autoProducts.length})
          </h3>
          <div className="space-y-2">
            {autoProducts.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-md border"
                style={{
                  backgroundColor: 'var(--color-bg-elevated-1)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {product.name}
                    </p>
                    {product.alias && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{
                        backgroundColor: 'var(--color-bg-elevated-2)',
                        color: 'var(--color-text-tertiary)'
                      }}>
                        {product.alias}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6'
                    }}>
                      {product.file_count} 个文件
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      {product.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Products */}
      {manualProducts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            手动添加的产品 ({manualProducts.length})
          </h3>
          <div className="space-y-2">
            {manualProducts.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-md border"
                style={{
                  backgroundColor: 'var(--color-bg-elevated-1)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {product.name}
                    </p>
                    {product.alias && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{
                        backgroundColor: 'var(--color-bg-elevated-2)',
                        color: 'var(--color-text-tertiary)'
                      }}>
                        {product.alias}
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => startEdit(product)}
                    className="p-2 rounded-md transition-all duration-100"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-tertiary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 rounded-md transition-all duration-100"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-tertiary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-8 border rounded-lg" style={{
          backgroundColor: 'var(--color-bg-elevated-1)',
          borderColor: 'var(--color-border)',
          borderStyle: 'dashed'
        }}>
          <Package size={48} className="mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            暂无产品
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            点击"添加产品"按钮手动添加，或上传产品相关文件自动提取
          </p>
        </div>
      )}
    </div>
  )
}
