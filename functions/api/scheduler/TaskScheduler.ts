/**
 * Task Scheduler
 * 
 * 定时任务调度器，使用 Cloudflare Cron Triggers
 * 
 * @version 1.0.0
 */

import { DatabaseManager } from '../database/database.js';
import { AnalyticsService } from '../database/analytics.js';

/**
 * 任务接口
 */
export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // Cron 表达式
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  execute: (env: any) => Promise<void>;
}

/**
 * 任务调度器
 */
export class TaskScheduler {
  private tasks: Map<string, ScheduledTask>;

  constructor() {
    this.tasks = new Map();
    this.registerDefaultTasks();
  }

  /**
   * 注册默认任务
   */
  private registerDefaultTasks(): void {
    // 任务 1: 每天清理旧数据
    this.registerTask({
      id: 'cleanup-old-data',
      name: '清理旧数据',
      description: '删除 90 天前的历史数据',
      schedule: '0 2 * * *', // 每天凌晨 2 点
      enabled: true,
      execute: async (env: any) => {
        console.log('[Scheduler] Running cleanup task...');
        const db = new DatabaseManager(env.DB);
        await db.cleanupOldData(90);
        console.log('[Scheduler] Cleanup completed');
      },
    });

    // 任务 2: 每小时生成统计报告
    this.registerTask({
      id: 'generate-hourly-stats',
      name: '生成小时统计',
      description: '生成每小时的统计数据',
      schedule: '0 * * * *', // 每小时
      enabled: true,
      execute: async (env: any) => {
        console.log('[Scheduler] Generating hourly stats...');
        const db = new DatabaseManager(env.DB);
        const analytics = new AnalyticsService(db);

        // 获取所有公司的统计
        const companies = ['goldenyears']; // 可以从配置文件读取
        
        for (const companyId of companies) {
          const stats = await analytics.getCompanyStats(companyId, 1); // 最近 1 天
          console.log(`[Scheduler] Stats for ${companyId}:`, stats);
        }

        console.log('[Scheduler] Hourly stats completed');
      },
    });

    // 任务 3: 每周生成详细报告
    this.registerTask({
      id: 'generate-weekly-report',
      name: '生成周报',
      description: '生成每周的详细报告并发送',
      schedule: '0 9 * * 1', // 每周一上午 9 点
      enabled: true,
      execute: async (env: any) => {
        console.log('[Scheduler] Generating weekly report...');
        const db = new DatabaseManager(env.DB);
        const analytics = new AnalyticsService(db);

        const companies = ['goldenyears'];
        
        for (const companyId of companies) {
          // 生成 CSV 报告
          const csvReport = await analytics.generateCSVReport(companyId, 7);
          
          // TODO: 发送邮件或保存到 R2
          console.log(`[Scheduler] Weekly report for ${companyId} generated`);
          console.log(`Report length: ${csvReport.length} bytes`);
        }

        console.log('[Scheduler] Weekly report completed');
      },
    });

    // 任务 4: 每天优化数据库
    this.registerTask({
      id: 'optimize-database',
      name: '优化数据库',
      description: '运行数据库维护和优化任务',
      schedule: '0 3 * * *', // 每天凌晨 3 点
      enabled: true,
      execute: async (env: any) => {
        console.log('[Scheduler] Running database optimization...');
        const db = new DatabaseManager(env.DB);
        
        // 更新统计信息
        await db.db.exec('ANALYZE');
        
        console.log('[Scheduler] Database optimization completed');
      },
    });

    // 任务 5: 每 5 分钟更新意图统计
    this.registerTask({
      id: 'update-intent-statistics',
      name: '更新意图统计',
      description: '更新最近的意图统计数据',
      schedule: '*/5 * * * *', // 每 5 分钟
      enabled: true,
      execute: async (env: any) => {
        console.log('[Scheduler] Updating intent statistics...');
        const db = new DatabaseManager(env.DB);

        // 获取最近的意图数据并更新统计
        const companies = ['goldenyears'];
        
        for (const companyId of companies) {
          const intents = await db.getIntentStats(companyId);
          console.log(`[Scheduler] Updated ${intents.length} intents for ${companyId}`);
        }

        console.log('[Scheduler] Intent statistics updated');
      },
    });
  }

  /**
   * 注册任务
   */
  registerTask(task: ScheduledTask): void {
    this.tasks.set(task.id, task);
    console.log(`[Scheduler] Registered task: ${task.id} (${task.schedule})`);
  }

  /**
   * 取消注册任务
   */
  unregisterTask(taskId: string): void {
    this.tasks.delete(taskId);
    console.log(`[Scheduler] Unregistered task: ${taskId}`);
  }

  /**
   * 获取所有任务
   */
  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取指定任务
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 启用任务
   */
  enableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      console.log(`[Scheduler] Enabled task: ${taskId}`);
    }
  }

  /**
   * 禁用任务
   */
  disableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      console.log(`[Scheduler] Disabled task: ${taskId}`);
    }
  }

  /**
   * 执行指定任务
   */
  async executeTask(taskId: string, env: any): Promise<void> {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (!task.enabled) {
      console.log(`[Scheduler] Task ${taskId} is disabled, skipping`);
      return;
    }

    const startTime = Date.now();
    
    try {
      console.log(`[Scheduler] Executing task: ${task.name}`);
      await task.execute(env);
      
      const duration = Date.now() - startTime;
      console.log(`[Scheduler] Task ${task.name} completed in ${duration}ms`);
      
      // 更新最后运行时间
      task.lastRun = new Date();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Scheduler] Task ${task.name} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * 执行所有启用的任务
   */
  async executeAllTasks(env: any): Promise<void> {
    const enabledTasks = Array.from(this.tasks.values()).filter(
      (task) => task.enabled
    );

    console.log(`[Scheduler] Executing ${enabledTasks.length} tasks...`);

    for (const task of enabledTasks) {
      try {
        await this.executeTask(task.id, env);
      } catch (error) {
        console.error(`[Scheduler] Failed to execute task ${task.id}:`, error);
        // 继续执行其他任务
      }
    }

    console.log('[Scheduler] All tasks completed');
  }

  /**
   * 根据 Cron 事件执行任务
   */
  async handleScheduledEvent(event: any, env: any): Promise<void> {
    const cronExpression = event.cron;
    
    console.log(`[Scheduler] Handling cron event: ${cronExpression}`);

    // 查找匹配的任务
    const matchingTasks = Array.from(this.tasks.values()).filter(
      (task) => task.enabled && task.schedule === cronExpression
    );

    if (matchingTasks.length === 0) {
      console.log(`[Scheduler] No matching tasks for cron: ${cronExpression}`);
      return;
    }

    console.log(`[Scheduler] Found ${matchingTasks.length} matching tasks`);

    for (const task of matchingTasks) {
      try {
        await this.executeTask(task.id, env);
      } catch (error) {
        console.error(`[Scheduler] Failed to execute task ${task.id}:`, error);
      }
    }
  }

  /**
   * 获取任务状态报告
   */
  getStatusReport(): any {
    const tasks = Array.from(this.tasks.values());
    
    return {
      totalTasks: tasks.length,
      enabledTasks: tasks.filter((t) => t.enabled).length,
      disabledTasks: tasks.filter((t) => !t.enabled).length,
      tasks: tasks.map((task) => ({
        id: task.id,
        name: task.name,
        schedule: task.schedule,
        enabled: task.enabled,
        lastRun: task.lastRun?.toISOString(),
        nextRun: task.nextRun?.toISOString(),
      })),
    };
  }
}

// 导出单例
export const scheduler = new TaskScheduler();

export default TaskScheduler;
