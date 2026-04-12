# CI/CD Setup Guide - 超级洞察

## v2.30.0 Phase 3: Automated Testing & Coverage Reporting

本文档说明如何配置和使用项目的CI/CD自动化测试系统。

---

## 📋 Overview

### 已完成配置

1. ✅ **GitHub Actions工作流** - 自动化测试运行
2. ✅ **Vitest Coverage** - 代码覆盖率报告生成
3. ✅ **Codecov集成准备** - 覆盖率追踪配置（需配置token）

### 测试统计

- **总测试数**: 29个
- **认证API**: 11个测试 (100%)
- **评论搜索API**: 8个测试 (100%)
- **评论CRUD API**: 10个测试 (100%)
- **核心API覆盖率**: 6/6 endpoints (100%)

---

## 🚀 Quick Start

### 本地运行测试

```bash
# 运行所有测试
npm run test:run

# 运行特定测试文件
npm run test:run -- server/routes/__tests__/auth.route.test.ts

# 生成覆盖率报告
npm run test:coverage

# 查看HTML覆盖率报告
open coverage/index.html
```

### CI/CD自动触发

测试会在以下情况自动运行：

1. **Pull Request** - 提交到 `main` 分支的PR
2. **Push to Main** - 直接推送到 `main` 分支

---

## 📊 GitHub Actions Workflow

### 工作流文件

**位置**: `.github/workflows/test.yml`

### 工作流步骤

1. **Checkout代码** - 拉取最新代码
2. **Setup Node.js** - 配置Node.js 20.x环境
3. **安装依赖** - `npm ci` (干净安装)
4. **运行测试** - `npm run test:run`
5. **生成覆盖率** - `npm run test:coverage`
6. **上传Codecov** - 上传覆盖率到Codecov（需配置token）
7. **PR评论** - 在PR中自动评论测试结果

### 查看测试结果

1. 进入项目GitHub页面
2. 点击 **Actions** 标签
3. 查看最近的工作流运行记录
4. 点击具体的运行记录查看详细日志

---

## 📈 Codecov Integration（可选配置）

### 为什么使用Codecov？

- ✅ 可视化覆盖率趋势
- ✅ PR中自动显示覆盖率变化
- ✅ 代码覆盖率热图
- ✅ 历史覆盖率追踪

### 配置步骤

#### 1. 注册Codecov账号

访问: https://codecov.io

使用GitHub账号登录

#### 2. 添加仓库

1. 在Codecov中点击 **Add new repository**
2. 搜索 `超级洞察`
3. 点击 **Setup repo**

#### 3. 获取Token

Codecov会生成一个上传token: `CODECOV_TOKEN`

#### 4. 添加GitHub Secret

1. 进入GitHub仓库设置
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 名称: `CODECOV_TOKEN`
5. 值: 粘贴从Codecov获取的token
6. 点击 **Add secret**

#### 5. 验证集成

提交一个PR，检查：
- ✅ GitHub Actions测试通过
- ✅ Codecov评论出现在PR中
- ✅ Codecov仪表板显示覆盖率

---

## 📝 Coverage Configuration

### Vitest覆盖率配置

**文件**: `vitest.config.ts`

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: ['server/**/*.ts', 'src/**/*.{ts,tsx}'],
  exclude: [
    'node_modules/',
    'server/**/__tests__/**',
    'src/**/__tests__/**',
    'src/test/**',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/types.ts',
    '**/*.d.ts',
  ],
  all: true,
  lines: 60,
  functions: 60,
  branches: 60,
  statements: 60,
}
```

### Codecov配置

**文件**: `codecov.yml`

- **项目覆盖率目标**: 60%
- **Patch覆盖率目标**: 60%
- **覆盖率变化阈值**: ±5%

---

## 🔧 Troubleshooting

### 问题1: GitHub Actions测试失败

**症状**: Actions中显示红色×

**排查步骤**:
1. 查看Actions日志，定位失败的测试
2. 本地运行 `npm run test:run` 复现问题
3. 修复测试或代码
4. 重新提交

### 问题2: Codecov上传失败

**症状**: Actions成功但Codecov无数据

**排查步骤**:
1. 检查 `CODECOV_TOKEN` secret是否正确配置
2. 查看Actions日志中的"Upload coverage to Codecov"步骤
3. 确认 `coverage/coverage-final.json` 文件存在
4. 查看Codecov仪表板是否有错误信息

### 问题3: 覆盖率突然下降

**原因**: 新增未测试的代码

**解决方案**:
1. 查看Codecov的diff视图，找到未覆盖的代码
2. 补充相应的测试用例
3. 确保新功能都有对应测试

### 问题4: 测试在CI中失败但本地通过

**可能原因**:
- 环境变量差异
- 数据库状态不一致
- 文件路径问题（大小写）

**解决方案**:
1. 检查环境变量配置
2. 确保测试隔离（使用独立数据库）
3. 使用相对路径，避免硬编码路径

---

## 📌 Best Practices

### 测试编写

1. ✅ **每个API endpoint至少1个测试**
2. ✅ **使用Given-When-Then结构**
3. ✅ **测试独立运行**（不依赖其他测试）
4. ✅ **清理测试数据**（afterEach）

### PR流程

1. ✅ **提交PR前本地运行测试**
2. ✅ **确保所有测试通过**
3. ✅ **检查覆盖率是否下降**
4. ✅ **补充必要的测试用例**

### 覆盖率目标

- **最低要求**: 60% (已配置)
- **推荐目标**: 75-80%
- **理想目标**: 85%+

**注意**: 不追求100%覆盖率，重点是核心业务逻辑覆盖

---

## 📚 Related Documentation

- [TESTING-GUIDE.md](./TESTING-GUIDE.md) - 测试编写指南
- [v2.30.0-PHASE1-SOLUTION.md](./v2.30.0-PHASE1-SOLUTION.md) - 测试隔离解决方案
- [v2.30.0-PHASE2-COMPLETE.md](./v2.30.0-PHASE2-COMPLETE.md) - 测试覆盖补充报告
- [CHANGELOG.md](./CHANGELOG.md) - 版本变更记录

---

## 🎯 Roadmap

### Phase 3完成 ✅
- [x] GitHub Actions workflow配置
- [x] Vitest覆盖率报告
- [x] Codecov集成准备
- [x] PR评论自动化
- [x] 文档完善

### 未来优化（可选）
- [ ] Slack/钉钉测试失败通知
- [ ] 测试性能监控
- [ ] E2E测试集成（Playwright）
- [ ] 视觉回归测试

---

**文档创建时间**: 2026-04-12  
**版本**: v2.30.0 Phase 3  
**状态**: ✅ 完成
