# UniInsight（升学问问）

去中介化的真实升学信息社区：短讨论、结构化评价、Star 评分与 AI 聚合，帮助学生看清学校、专业、课程、导师与就业的全貌。

## 项目结构

```text
uni-insight/
├── apps/web/            # Next.js 前端 + Route Handlers（MVP API）
├── packages/core/       # 共享常量与类型（场景、Star 公式、等级）
├── prisma/              # 数据模型与数据库
├── scripts/             # 种子数据脚本
├── config/              # 环境变量样例、广告词库、Star 公式
├── worker/              # 后台任务占位（AI 总结、通知、推荐）
└── package.json         # npm workspaces
```

## 本地启动

```bash
npm install
npm run db:generate
npm run db:init
npm run db:seed
npm run dev
```

打开 http://localhost:3000 。

## 测试账号

| 用途 | 邮箱 | 密码 | 说明 |
|---|---|---|---|
| 发布提问 | seeker@demo.uni | Test1234! | 高三考生视角，未认证 |
| 回答问题 | alumni@demo.uni | Test1234! | 中山大学经济学认证校友，L2，可发布 AI 精选帖 |

数据库默认使用 SQLite（`prisma/dev.db`），方便零依赖本地运行；生产环境按 v4 蓝图切换 PostgreSQL。

## 当前范围（初步框架）

- 场景化提问（高考志愿/转专业/考研保研/申研留学/导师选择/就业行业）
- 280 字回复 + 语音转文字（Web Speech API）
- 问题/回复/AI 精选帖 star + Star 计分与等级
- 系统 AI 摘要展示 + 用户发起 AI 精选帖（未配置 LLM Key 时使用离线模板）
- 两个测试账号与中山大学经济学演示数据

后续按 `../蓝图/UniInsight_开发蓝图_v4.md` 迭代。
