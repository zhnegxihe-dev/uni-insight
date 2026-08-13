# worker

后台任务占位目录。按 v4 蓝图，后续在这里实现 BullMQ worker：

- ai-summary-queue：系统自动 AI 总结（回复数达到阈值后生成/更新）
- ai-post-queue：用户发起的 AI 精选帖生成
- star-recompute-queue：star 计分重算
- notification-queue：站内/邮件通知
- recommendation-job：每日推荐刷新

当前初步框架阶段，AI 精选帖在 API 层同步使用离线模板生成，后续迁移到这里异步执行。
