/**
 * 文件名：taskManager.ts
 * 功能：爬虫任务队列管理器
 * 作者：AI Assistant
 * 创建日期：2025-10-29
 * 
 * 说明：
 * - 任务队列管理
 * - 支持暂停/恢复/终止
 * - 单例模式，全局唯一
 */

import { supabase } from '../supabase';
import { crawlSingleTool, preCheckUrls } from './index';
import { scrapeToolDomains, normalizeDomain, scrapeToolifyAi } from './scraper';

// 任务状态类型
export type TaskStatus = 'pending' | 'running' | 'paused' | 'stopped' | 'completed' | 'failed';
export type TaskType = 'tools' | 'navigation' | 'toolify';

// 任务接口
export interface CrawlerTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  urls: string[];
  navigation_url?: string;
  max_pages?: number;
  total: number;
  current: number;
  success: number;
  failed: number;
  skipped: number;
  blacklisted: number; // 黑名单工具数量
  created_at: string;
  started_at?: string;
  error_message?: string;
}

// 任务日志接口
export interface TaskLog {
  url: string;
  domain: string;
  status: 'success' | 'failed' | 'skipped' | 'processing';
  tool_id?: string;
  error_type?: string;
  error_message?: string;
  duration_seconds?: number;
}

// 错误类型枚举
export enum CrawlerErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  PARSING = 'PARSING',
  AI_FAILED = 'AI_FAILED',
  SCREENSHOT = 'SCREENSHOT',
  LOGO = 'LOGO',
  DUPLICATE = 'DUPLICATE',
  INVALID = 'INVALID',
  STOPPED = 'STOPPED',
  UNKNOWN = 'UNKNOWN',
}

// 全局存储（避免Next.js热重载导致单例丢失）
const globalForTaskManager = globalThis as unknown as {
  taskManagerInstance: TaskManager | undefined;
  taskManagerLogs: Array<{ time: string; message: string }>;
};

/**
 * 任务管理器（单例）
 */
class TaskManager {
  private static instance: TaskManager;
  private currentTask: string | null = null;
  private shouldStop = false;
  private shouldPause = false;
  private currentStep: string = ''; // 当前步骤信息
  private currentUrl: string = ''; // 当前处理的 URL
  private maxLogs = 100; // 最多保留100条日志

  private constructor() {
    // 初始化全局日志存储
    if (!globalForTaskManager.taskManagerLogs) {
      globalForTaskManager.taskManagerLogs = [];
    }
  }

  static getInstance(): TaskManager {
    // 使用 globalThis 保存实例，避免热重载影响
    if (!globalForTaskManager.taskManagerInstance) {
      globalForTaskManager.taskManagerInstance = new TaskManager();
    }
    return globalForTaskManager.taskManagerInstance;
  }

  /**
   * 检查是否有正在运行的任务
   */
  async hasRunningTask(): Promise<boolean> {
    return this.currentTask !== null;
  }

  /**
   * 获取当前运行的任务ID
   */
  getCurrentTaskId(): string | null {
    return this.currentTask;
  }

  /**
   * 获取当前步骤信息
   */
  getCurrentStep(): { url: string; step: string } {
    return {
      url: this.currentUrl,
      step: this.currentStep,
    };
  }

  /**
   * 添加实时日志（使用全局存储）
   */
  private addLog(message: string) {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const logEntry = { time, message };
    
    // 确保全局日志数组存在
    if (!globalForTaskManager.taskManagerLogs) {
      globalForTaskManager.taskManagerLogs = [];
    }
    
    globalForTaskManager.taskManagerLogs.push(logEntry);
    
    // 调试：输出添加后的数组长度
    console.log(`[addLog] 添加日志: ${message} | 当前数组长度: ${globalForTaskManager.taskManagerLogs.length}`);
    
    // 限制日志数量
    if (globalForTaskManager.taskManagerLogs.length > this.maxLogs) {
      globalForTaskManager.taskManagerLogs.shift();
    }
    
    // 同时输出到控制台
    console.log(message);
  }

  /**
   * 获取实时日志（从全局存储）
   */
  getRealtimeLogs(): Array<{ time: string; message: string }> {
    if (!globalForTaskManager.taskManagerLogs) {
      globalForTaskManager.taskManagerLogs = [];
    }
    console.log(`[getRealtimeLogs] 返回日志数量: ${globalForTaskManager.taskManagerLogs.length}`);
    return [...globalForTaskManager.taskManagerLogs];
  }

  /**
   * 清空实时日志（清空全局存储）
   */
  clearRealtimeLogs() {
    globalForTaskManager.taskManagerLogs = [];
  }

  /**
   * 创建新任务
   */
  async createTask(
    type: TaskType,
    urls: string[],
    navigationUrl?: string,
    maxPages?: number,
    toolLimit?: number
  ): Promise<string> {
    // 规范化 URLs
    const normalizedUrls = [...new Set(urls.map(url => url.trim()).filter(Boolean))];

    const { data, error } = await supabase
      .from('crawler_tasks')
      .insert({
        type,
        status: 'pending',
        urls: normalizedUrls,
        navigation_url: navigationUrl,
        max_pages: maxPages || 1,
        tool_limit: toolLimit || null,
        total: normalizedUrls.length,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * 启动任务
   */
  async startTask(taskId: string): Promise<void> {
    // 检查是否有其他任务正在运行
    if (this.currentTask && this.currentTask !== taskId) {
      throw new Error('有其他任务正在运行，请等待或终止该任务');
    }

    // 获取任务信息
    const { data: task, error } = await supabase
      .from('crawler_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      throw new Error('任务不存在');
    }

    // 检查任务状态
    if (task.status === 'completed') {
      throw new Error('任务已完成');
    }

    if (task.status === 'stopped') {
      throw new Error('任务已终止');
    }

    // 设置当前任务
    this.currentTask = taskId;
    this.shouldStop = false;
    this.shouldPause = false;

    // 清空实时日志并添加初始日志
    this.clearRealtimeLogs();
    this.addLog('🚀 任务启动...');
    this.addLog(`📋 任务类型: ${task.type === 'toolify' ? 'Toolify.ai 预设采集' : task.type === 'navigation' ? '导航站采集' : '工具爬取'}`);
    this.addLog(`🎯 目标数量: ${task.total} 个`);

    // 更新任务状态
    await supabase
      .from('crawler_tasks')
      .update({
        status: 'running',
        started_at: task.started_at || new Date().toISOString(),
      })
      .eq('id', taskId);

    // 在后台执行任务
    this.executeTask(taskId, task).catch(async (error) => {
      console.error('任务执行失败:', error);
      await this.updateTaskStatus(taskId, 'failed', error.message);
      this.currentTask = null;
      this.shouldStop = false;
      this.shouldPause = false;
    });
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: string): Promise<void> {
    if (this.currentTask !== taskId) {
      throw new Error('任务未在运行');
    }

    this.shouldPause = true;
    this.addLog('⏸️ 正在暂停任务...');

    // 更新数据库状态
    await supabase
      .from('crawler_tasks')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
      })
      .eq('id', taskId);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId: string): Promise<void> {
    // 检查是否有其他任务在运行
    if (this.currentTask && this.currentTask !== taskId) {
      throw new Error('有其他任务正在运行');
    }

    const { data: task, error } = await supabase
      .from('crawler_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      throw new Error('任务不存在');
    }

    if (task.status === 'stopped') {
      throw new Error('已终止的任务无法恢复');
    }

    if (task.status === 'completed') {
      throw new Error('已完成的任务无法恢复');
    }

    if (task.status !== 'paused') {
      throw new Error('任务未处于暂停状态');
    }

    // 恢复执行
    this.currentTask = taskId;
    this.shouldPause = false;
    this.shouldStop = false;

    // 清空实时日志并添加恢复日志
    this.clearRealtimeLogs();
    this.addLog('▶️ 任务恢复运行...');
    this.addLog(`📊 当前进度: ${task.current}/${task.total}`);

    await supabase
      .from('crawler_tasks')
      .update({
        status: 'running',
      })
      .eq('id', taskId);

    // 继续执行
    this.executeTask(taskId, task).catch(async (error) => {
      console.error('任务执行失败:', error);
      await this.updateTaskStatus(taskId, 'failed', error.message);
      this.currentTask = null;
      this.shouldPause = false;
      this.shouldStop = false;
    });
  }

  /**
   * 终止任务
   */
  async stopTask(taskId: string): Promise<void> {
    if (this.currentTask !== taskId) {
      // 如果任务未在运行，直接更新状态
      await supabase
        .from('crawler_tasks')
        .update({
          status: 'stopped',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      return;
    }

    this.shouldStop = true;
    this.addLog('🛑 正在终止任务...');

    // 更新数据库状态
    await supabase
      .from('crawler_tasks')
      .update({
        status: 'stopped',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);
    
    // 清理内部状态
    this.currentTask = null;
    this.shouldPause = false;
    this.currentUrl = '';
    this.currentStep = '';
  }

  /**
   * 执行任务（内部方法）
   */
  private async executeTask(taskId: string, task: any): Promise<void> {
    try {
      let urls = task.urls;

      // 调试日志
      console.log('🔍 executeTask 调试信息:', {
        taskId,
        type: task.type,
        navigation_url: task.navigation_url,
        max_pages: task.max_pages,
        urls_length: task.urls?.length
      });

      // 如果是 Toolify.ai 预设采集，使用两步采集（流式处理）
      if (task.type === 'toolify' && task.navigation_url) {
        this.addLog('🎯 Toolify.ai 预设采集模式');
        
        try {
          // extractLinksFromToolify 内部已经通过批次回调处理了所有链接
          // 包括：提取 → 去重 → AI分析，所以这里直接返回即可
          await this.extractLinksFromToolify(
            taskId,
            task.navigation_url,
            task.max_pages || 1,
            task.tool_limit || 50
          );
          
          // 检查是否被终止
          if (this.shouldStop) {
            this.addLog('🛑 任务已终止');
            await this.updateTaskStatus(taskId, 'stopped');
          } else {
            // Toolify 任务已完成，更新状态
            this.addLog('🎉 Toolify.ai 采集任务完成');
            await this.updateTaskStatus(taskId, 'completed');
          }
        } catch (error: any) {
          this.addLog(`❌ Toolify.ai 采集失败: ${error.message}`);
          await this.updateTaskStatus(taskId, 'failed', error.message);
        } finally {
          this.currentTask = null;
          this.shouldStop = false;
        }
        return;
      }
      // 如果是导航站采集，先提取链接
      else if (task.type === 'navigation' && task.navigation_url) {
        urls = await this.extractLinksFromNavigation(
          taskId,
          task.navigation_url,
          task.max_pages || 1
        );

        // 应用数量限制
        if (task.tool_limit && urls.length > task.tool_limit) {
          console.log(`⚠️  提取到 ${urls.length} 个链接，根据限制只爬取前 ${task.tool_limit} 个`);
          urls = urls.slice(0, task.tool_limit);
        }

        // 更新任务的 URLs 和总数
        await supabase
          .from('crawler_tasks')
          .update({
            urls,
            total: urls.length,
          })
          .eq('id', taskId);
      }

      // 预检查：同时检测重复和黑名单
      this.addLog(`🔍 正在预检查 ${urls.length} 个链接（重复 + 黑名单）...`);
      const preCheckResult = await preCheckUrls(urls);
      
      console.log(`✅ 预检查完成：`);
      console.log(`   - 总计: ${preCheckResult.total}`);
      console.log(`   - 新工具: ${preCheckResult.newUrls.length}`);
      console.log(`   - 重复: ${preCheckResult.duplicateCount}`);
      console.log(`   - 黑名单: ${preCheckResult.blacklistedCount}`);
      
      this.addLog(`✅ 预检查完成：新工具 ${preCheckResult.newUrls.length}，重复 ${preCheckResult.duplicateCount}，黑名单 ${preCheckResult.blacklistedCount}`);

      // 记录跳过的重复工具
      for (const url of preCheckResult.duplicateUrls) {
        await this.saveLog(taskId, {
          url,
          domain: normalizeDomain(url),
          status: 'skipped',
          error_type: CrawlerErrorType.DUPLICATE,
          error_message: '工具已存在',
        });
      }

      // 记录跳过的黑名单工具
      for (const url of preCheckResult.blacklistedUrls) {
        await this.saveLog(taskId, {
          url,
          domain: normalizeDomain(url),
          status: 'skipped',
          error_type: 'BLACKLISTED' as any,
          error_message: '黑名单工具（失败3次以上）',
        });
      }

      // 更新跳过数量和黑名单数量
      await supabase
        .from('crawler_tasks')
        .update({ 
          skipped: preCheckResult.duplicateCount,
          blacklisted: preCheckResult.blacklistedCount,
        })
        .eq('id', taskId);

      const newUrls = preCheckResult.newUrls;

      // 逐个爬取
      let current = task.current || 0;

      // 添加开始爬取日志
      this.addLog(`🚀 开始爬取 ${newUrls.length} 个新工具...`);

      for (let i = current; i < newUrls.length; i++) {
        // 检查是否应该停止
        if (this.shouldStop) {
          console.log('⏹️ 任务已终止');
          this.addLog('⏹️ 任务已终止');
          this.currentTask = null;
          return;
        }

        // 检查是否应该暂停
        if (this.shouldPause) {
          console.log('⏸️ 任务已暂停');
          this.addLog('⏸️ 任务已暂停');
          this.currentTask = null;
          return;
        }

        const url = newUrls[i];
        console.log(`\n[${i + 1}/${newUrls.length}] 爬取: ${url}`);
        this.addLog(`🔍 [${i + 1}/${newUrls.length}] 正在爬取: ${normalizeDomain(url)}`);

        // 更新当前进度
        await supabase
          .from('crawler_tasks')
          .update({ current: i + 1 })
          .eq('id', taskId);

        // 记录为处理中
        const logId = await this.saveLog(taskId, {
          url,
          domain: normalizeDomain(url),
          status: 'processing',
        });

        const startTime = Date.now();

        // 设置当前处理的 URL
        this.currentUrl = url;
        this.currentStep = '开始爬取...';

        try {
          // 爬取工具（带进度回调和终止检查）
          const result = await crawlSingleTool(
            url,
            undefined,
            (step, message) => {
              // 更新当前步骤
              this.currentStep = message;
            },
            () => this.shouldStop // 传递终止检查函数
          );

          const duration = Math.round((Date.now() - startTime) / 1000);

          if (result.success) {
            // 成功
            await this.updateLog(logId, {
              status: 'success',
              tool_id: result.toolId,
              duration_seconds: duration,
            });

            // 增加成功计数
            task.success = (task.success || 0) + 1;
            await supabase
              .from('crawler_tasks')
              .update({ success: task.success })
              .eq('id', taskId);
            
            this.addLog(`✅ 成功: ${normalizeDomain(url)} (${duration}s)`);
          } else {
            // 检查是否是任务终止
            if (result.error?.includes('任务已终止')) {
              console.log('⏹️ 检测到任务终止信号，退出爬取循环');
              this.addLog('⏹️ 检测到任务终止信号');
              await this.updateLog(logId, {
                status: 'skipped',
                error_type: CrawlerErrorType.STOPPED,
                error_message: '任务已终止',
                duration_seconds: duration,
              });
              break; // 立即退出循环
            }
            
            // 失败或跳过
            const errorType = this.classifyError(result.error || '');
            
            // 如果是工具已存在，标记为跳过而不是失败
            if (result.error?.includes('工具已存在') || result.error?.includes('已存在')) {
              await this.updateLog(logId, {
                status: 'skipped',
                error_type: CrawlerErrorType.DUPLICATE,
                error_message: result.error,
                duration_seconds: duration,
              });

              // 增加跳过计数
              task.skipped = (task.skipped || 0) + 1;
              await supabase
                .from('crawler_tasks')
                .update({ skipped: task.skipped })
                .eq('id', taskId);
              
              this.addLog(`⏭️ 跳过: ${normalizeDomain(url)} (已存在)`);
            } else {
              // 真正的失败
              await this.updateLog(logId, {
                status: 'failed',
                error_type: errorType,
                error_message: result.error,
                duration_seconds: duration,
              });

              // 增加失败计数
              task.failed = (task.failed || 0) + 1;
              await supabase
                .from('crawler_tasks')
                .update({ failed: task.failed })
                .eq('id', taskId);
              
              this.addLog(`❌ 失败: ${normalizeDomain(url)} (${errorType})`);
            }
          }
        } catch (error: any) {
          // 异常
          const duration = Math.round((Date.now() - startTime) / 1000);
          const errorType = this.classifyError(error.message);

          await this.updateLog(logId, {
            status: 'failed',
            error_type: errorType,
            error_message: error.message,
            duration_seconds: duration,
          });

          // 增加失败计数
          task.failed = (task.failed || 0) + 1;
          await supabase
            .from('crawler_tasks')
            .update({ failed: task.failed })
            .eq('id', taskId);
          
          this.addLog(`💥 异常: ${normalizeDomain(url)} (${error.message})`);
        }

        // 延迟，避免请求过快
        if (i < newUrls.length - 1) {
          await this.sleep(1000);
        }
      }

      // 检查任务是否被终止
      if (this.shouldStop) {
        console.log('⏹️ 任务已终止');
        this.addLog('⏹️ 任务已终止');
        // 状态已在 stopTask 中更新，这里只需要清理
        this.currentTask = null;
        this.shouldStop = false;
        this.shouldPause = false;
        this.currentUrl = '';
        this.currentStep = '';
      } else if (this.shouldPause) {
        console.log('⏸️ 任务已暂停');
        this.addLog('⏸️ 任务已暂停');
        // 状态已在 pauseTask 中更新，这里只需要清理
        this.currentTask = null;
        this.shouldPause = false;
        this.currentUrl = '';
        this.currentStep = '';
      } else {
        // 任务正常完成
        await this.updateTaskStatus(taskId, 'completed');
        this.currentTask = null;
        this.shouldStop = false;
        this.shouldPause = false;
        this.currentUrl = '';
        this.currentStep = '';
        console.log('✅ 任务完成！');
        
        // 添加完成总结
        const finalTask = await this.getTask(taskId);
        if (finalTask) {
          this.addLog(`🎉 任务完成！成功 ${finalTask.success || 0}，失败 ${finalTask.failed || 0}，跳过重复 ${finalTask.skipped || 0}，跳过黑名单 ${finalTask.blacklisted || 0}`);
        }
      }
    } catch (error: any) {
      console.error('任务执行失败:', error);
      await this.updateTaskStatus(taskId, 'failed', error.message);
      this.currentTask = null;
      this.shouldStop = false;
      this.shouldPause = false;
      this.currentUrl = '';
      this.currentStep = '';
      throw error;
    }
  }

  /**
   * 从 Toolify.ai 提取链接（两步采集）
   */
  private async extractLinksFromToolify(
    taskId: string,
    toolifyUrl: string,
    maxPages: number,
    toolLimit?: number
  ): Promise<string[]> {
    this.addLog(`🎯 开始 Toolify.ai 两步采集: ${toolifyUrl}`);
    this.addLog(`📄 最多爬取 ${maxPages} 页`);

    // 更新进度
    this.currentStep = `🎯 Toolify.ai 两步采集，最多爬取 ${maxPages} 页`;

    try {
      // 传递终止检查函数和数量限制
      const shouldStopCheck = () => this.shouldStop;
      
      // 批次处理回调：每批次提取完立即去重并开始AI分析
      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      let totalBlacklisted = 0;
      
      const onBatchExtracted = async (batchUrls: string[]) => {
        if (this.shouldStop) return;
        
        this.addLog(`📦 批次提取完成，开始处理 ${batchUrls.length} 个链接...`);
        
        // 立即去重和黑名单检查
        const preCheckResult = await preCheckUrls(batchUrls);
        
        totalSkipped += preCheckResult.duplicateCount;
        totalBlacklisted += preCheckResult.blacklistedCount;
        
        this.addLog(`   ✅ 去重完成：新工具 ${preCheckResult.newUrls.length}，重复 ${preCheckResult.duplicateCount}，黑名单 ${preCheckResult.blacklistedCount}`);
        
        // 记录跳过的重复工具
        for (const url of preCheckResult.duplicateUrls) {
          await this.saveLog(taskId, {
            url,
            domain: normalizeDomain(url),
            status: 'skipped',
            error_type: 'DUPLICATE' as any,
            error_message: '工具已存在',
          });
        }
        
        // 记录跳过的黑名单工具
        for (const url of preCheckResult.blacklistedUrls) {
          await this.saveLog(taskId, {
            url,
            domain: normalizeDomain(url),
            status: 'skipped',
            error_type: 'BLACKLISTED' as any,
            error_message: '黑名单工具（失败3次以上）',
          });
        }
        
        // 立即开始AI分析这批新工具
        if (preCheckResult.newUrls.length > 0) {
          this.addLog(`   🚀 开始AI分析 ${preCheckResult.newUrls.length} 个新工具...`);
          
          // 逐个爬取这批新工具
          for (const url of preCheckResult.newUrls) {
            if (this.shouldStop) break;
            
            totalProcessed++;
            this.addLog(`   🔍 [${totalProcessed}] 正在爬取: ${normalizeDomain(url)}`);
            
            try {
              const result = await crawlSingleTool(url);
              
              if (result.success) {
                totalSuccess++;
                this.addLog(`   ✅ 成功: ${normalizeDomain(url)}`);
                
                // 保存成功日志
                await this.saveLog(taskId, {
                  url,
                  domain: normalizeDomain(url),
                  status: 'success',
                });
                
                // 更新任务进度
                await supabase
                  .from('crawler_tasks')
                  .update({ 
                    current: totalProcessed,
                    success: totalSuccess,
                    skipped: totalSkipped,
                    blacklisted: totalBlacklisted,
                  })
                  .eq('id', taskId);
              } else {
                totalFailed++;
                this.addLog(`   ❌ 失败: ${normalizeDomain(url)} - ${result.error}`);
                
                // 保存失败日志
                await this.saveLog(taskId, {
                  url,
                  domain: normalizeDomain(url),
                  status: 'failed',
                  error_message: result.error,
                });
                
                // 更新任务进度
                await supabase
                  .from('crawler_tasks')
                  .update({ 
                    current: totalProcessed,
                    failed: totalFailed,
                    skipped: totalSkipped,
                    blacklisted: totalBlacklisted,
                  })
                  .eq('id', taskId);
              }
            } catch (error: any) {
              totalFailed++;
              this.addLog(`   ❌ 失败: ${normalizeDomain(url)} - ${error.message}`);
              
              // 保存失败日志
              await this.saveLog(taskId, {
                url,
                domain: normalizeDomain(url),
                status: 'failed',
                error_message: error.message,
              });
              
              // 更新任务进度
              await supabase
                .from('crawler_tasks')
                .update({ 
                  current: totalProcessed,
                  failed: totalFailed,
                  skipped: totalSkipped,
                  blacklisted: totalBlacklisted,
                })
                .eq('id', taskId);
            }
          }
        }
      };
      
      await scrapeToolifyAi(toolifyUrl, shouldStopCheck, toolLimit, undefined, onBatchExtracted);
      
      // 检查是否被终止
      if (this.shouldStop) {
        this.addLog(`🛑 Toolify.ai 采集已终止`);
        return [];
      }
      
      this.addLog(`🎉 Toolify.ai 流式采集完成！`);
      this.addLog(`📊 统计：成功 ${totalSuccess}，失败 ${totalFailed}，重复 ${totalSkipped}，黑名单 ${totalBlacklisted}`);
      return [];
    } catch (error: any) {
      this.addLog(`❌ Toolify.ai 采集失败: ${error.message}`);
      throw new Error(`Toolify.ai 采集失败: ${error.message}`);
    }
  }

  /**
   * 构建分页URL（智能识别常见分页模式）
   */
  private buildPaginatedUrl(baseUrl: string, page: number): string {
    try {
      const url = new URL(baseUrl);
      
      // 常见分页模式检测
      const pathname = url.pathname;
      const searchParams = url.searchParams;
      
      // 模式1: 已有 ?page= 参数
      if (searchParams.has('page')) {
        searchParams.set('page', page.toString());
        return url.toString();
      }
      
      // 模式2: 已有 ?p= 参数
      if (searchParams.has('p')) {
        searchParams.set('p', page.toString());
        return url.toString();
      }
      
      // 模式3: 路径末尾是 /page/数字
      if (/\/page\/\d+\/?$/.test(pathname)) {
        url.pathname = pathname.replace(/\/page\/\d+\/?$/, `/page/${page}`);
        return url.toString();
      }
      
      // 模式4: 路径末尾是 /数字
      if (/\/\d+\/?$/.test(pathname)) {
        url.pathname = pathname.replace(/\/\d+\/?$/, `/${page}`);
        return url.toString();
      }
      
      // 模式5: toolify.ai 特殊处理（使用 ?page= 参数）
      if (url.hostname.includes('toolify.ai')) {
        searchParams.set('page', page.toString());
        return url.toString();
      }
      
      // 默认：添加 ?page= 参数
      searchParams.set('page', page.toString());
      return url.toString();
    } catch (error) {
      console.error('构建分页URL失败:', error);
      // 降级：简单拼接
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}page=${page}`;
    }
  }

  /**
   * 从导航站提取链接
   */
  private async extractLinksFromNavigation(
    taskId: string,
    navigationUrl: string,
    maxPages: number
  ): Promise<string[]> {
    this.addLog(`🌐 开始分析导航站: ${navigationUrl}`);
    this.addLog(`📄 最多爬取 ${maxPages} 页`);

    // 更新进度
    this.currentStep = `🌐 开始分析导航站，最多爬取 ${maxPages} 页`;

    const allUrls: string[] = [];
    let consecutiveEmptyPages = 0; // 连续空页计数
    const maxConsecutiveEmpty = 2; // 最多允许2次连续空页

    try {
      for (let page = 1; page <= maxPages; page++) {
        this.addLog(`📄 正在爬取第 ${page}/${maxPages} 页...`);
        
        // 构建分页URL
        const pageUrl = page === 1 ? navigationUrl : this.buildPaginatedUrl(navigationUrl, page);
        
        // 更新进度
        this.currentStep = `📄 正在爬取第 ${page}/${maxPages} 页，正在加载页面...`;
        this.addLog(`   - URL: ${pageUrl}`);

        // 爬取当前页
        const pageUrls = await scrapeToolDomains(pageUrl);

        if (pageUrls.length === 0) {
          consecutiveEmptyPages++;
          this.addLog(`⚠️ 第 ${page} 页没有找到链接（连续空页: ${consecutiveEmptyPages}/${maxConsecutiveEmpty}）`);
          
          // 如果连续多页为空，可能已经到底了
          if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
            this.addLog(`🛑 连续 ${maxConsecutiveEmpty} 页为空，停止爬取`);
            this.currentStep = `🛑 连续 ${maxConsecutiveEmpty} 页为空，停止爬取`;
            await this.sleep(1000);
            break;
          }
          
          // 继续尝试下一页
          this.currentStep = `⚠️ 第 ${page} 页为空，继续尝试下一页...`;
          await this.sleep(2000);
          continue;
        }

        // 重置连续空页计数
        consecutiveEmptyPages = 0;
        
        // 检查是否与上一页完全重复（说明分页无效）
        const currentPageUrls = new Set(pageUrls);
        if (page > 1 && allUrls.length > 0) {
          const previousUrls = new Set(allUrls.slice(-pageUrls.length));
          const intersection = new Set([...currentPageUrls].filter(x => previousUrls.has(x)));
          const duplicateRate = intersection.size / currentPageUrls.size;
          
          if (duplicateRate > 0.9) { // 超过90%重复
            this.addLog(`⚠️ 第 ${page} 页与前一页重复率 ${(duplicateRate * 100).toFixed(0)}%，可能分页无效`);
            this.addLog(`💡 建议：尝试手动添加分页参数，或选择其他导航站`);
            this.currentStep = `⚠️ 分页可能无效（重复率过高），停止爬取`;
            await this.sleep(1000);
            break;
          }
        }

        allUrls.push(...pageUrls);
        this.addLog(`✅ 第 ${page} 页找到 ${pageUrls.length} 个链接（新增 ${currentPageUrls.size} 个）`);
        
        // 更新进度
        this.currentStep = `✅ 第 ${page}/${maxPages} 页爬取完成，找到 ${pageUrls.length} 个链接 (累计: ${allUrls.length})`;

        // 如果不是最后一页，延迟一下
        if (page < maxPages) {
          await this.sleep(2000);
        }
      }

      // 去重
      const uniqueUrls = [...new Set(allUrls)];
      this.addLog(`✅ 总共找到 ${allUrls.length} 个链接，去重后 ${uniqueUrls.length} 个`);
      
      // 更新进度
      this.currentStep = `✅ 链接提取完成！总共 ${allUrls.length} 个，去重后 ${uniqueUrls.length} 个`;
      await this.sleep(1500);

      return uniqueUrls;
    } catch (error: any) {
      this.addLog(`❌ 提取链接失败: ${error.message}`);
      this.currentStep = `❌ 提取链接失败: ${error.message}`;
      throw new Error(`导航站分析失败: ${error.message}`);
    }
  }

  /**
   * 批量检查已存在的工具
   */
  private async checkExistingTools(urls: string[]): Promise<Set<string>> {
    const domains = urls.map(url => normalizeDomain(url));
    const existing = new Set<string>();

    // 更新进度
    this.currentStep = `🔍 正在检查 ${domains.length} 个链接是否已存在...`;
    this.addLog(`🔍 正在检查 ${domains.length} 个链接是否已存在...`);

    // 分批查询（每批 100 个）
    const batchSize = 100;
    const totalBatches = Math.ceil(domains.length / batchSize);
    
    for (let i = 0; i < domains.length; i += batchSize) {
      const batchNum = Math.floor(i / batchSize) + 1;
      const batch = domains.slice(i, i + batchSize);
      
      // 更新进度
      this.currentStep = `🔍 检查进度: ${batchNum}/${totalBatches} (已找到 ${existing.size} 个重复)`;
      this.addLog(`   - 批次 ${batchNum}/${totalBatches} (已找到 ${existing.size} 个重复)`);
      
      const { data } = await supabase
        .from('tools')
        .select('domain')
        .in('domain', batch);

      data?.forEach(t => existing.add(t.domain));
    }

    // 更新进度
    this.currentStep = `✅ 检查完成！发现 ${existing.size} 个已存在工具，将跳过`;
    this.addLog(`✅ 检查完成！发现 ${existing.size} 个已存在工具，将跳过`);
    await this.sleep(1500);

    return existing;
  }

  /**
   * 保存日志
   */
  private async saveLog(taskId: string, log: Partial<TaskLog>): Promise<string> {
    const { data, error } = await supabase
      .from('crawler_task_logs')
      .insert({
        task_id: taskId,
        ...log,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * 更新日志
   */
  private async updateLog(logId: string, updates: Partial<TaskLog>): Promise<void> {
    await supabase
      .from('crawler_task_logs')
      .update({
        ...updates,
        completed_at: new Date().toISOString(),
      })
      .eq('id', logId);
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = { status };

    if (status === 'completed' || status === 'failed' || status === 'stopped') {
      updates.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    await supabase.from('crawler_tasks').update(updates).eq('id', taskId);
  }

  /**
   * 错误分类
   */
  private classifyError(errorMessage: string): string {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('timeout') || msg.includes('超时')) {
      return CrawlerErrorType.TIMEOUT;
    }
    if (msg.includes('network') || msg.includes('网络') || msg.includes('无法访问')) {
      return CrawlerErrorType.NETWORK;
    }
    if (msg.includes('ai') || msg.includes('deepseek') || msg.includes('分析')) {
      return CrawlerErrorType.AI_FAILED;
    }
    if (msg.includes('screenshot') || msg.includes('截图')) {
      return CrawlerErrorType.SCREENSHOT;
    }
    if (msg.includes('logo')) {
      return CrawlerErrorType.LOGO;
    }
    if (msg.includes('已存在') || msg.includes('duplicate')) {
      return CrawlerErrorType.DUPLICATE;
    }
    if (msg.includes('invalid') || msg.includes('无效')) {
      return CrawlerErrorType.INVALID;
    }

    return CrawlerErrorType.UNKNOWN;
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string): Promise<CrawlerTask | null> {
    const { data, error } = await supabase
      .from('crawler_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * 获取任务日志
   */
  async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    const { data, error } = await supabase
      .from('crawler_task_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return data;
  }
}

// 导出单例
export const taskManager = TaskManager.getInstance();

