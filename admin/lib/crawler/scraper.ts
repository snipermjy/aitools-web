/**
 * 文件名：scraper.ts
 * 功能：网站爬取核心功能
 * 作者：AI Assistant
 * 创建日期：2025-10-26
 * 
 * 说明：
 * - 使用 Puppeteer 爬取网站
 * - 获取网站内容和截图
 * - 提取域名列表
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import axios from 'axios';

let browser: Browser | null = null;

/**
 * 获取浏览器实例（单例模式）
 */
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    const launchOptions: any = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    };
    
    // 如果设置了Chrome路径，使用指定的Chrome
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    
    browser = await puppeteer.launch(launchOptions);
  }
  return browser;
}

/**
 * 关闭浏览器
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * 重试包装器
 * @param fn 要重试的异步函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 函数结果
 */
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`⚠️ 尝试 ${attempt}/${maxRetries} 失败: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`⏳ ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // 递增延迟（指数退避）
        delay *= 1.5;
      }
    }
  }
  
  throw lastError;
}

/**
 * 标准化 URL（确保有协议前缀）
 */
export function normalizeUrl(url: string): string {
  url = url.trim();
  
  // 如果已经有协议，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 如果以 www. 开头或看起来像域名，添加 https://
  if (url.startsWith('www.') || url.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
    return `https://${url}`;
  }
  
  // 默认添加 https://
  return `https://${url}`;
}

/**
 * 爬取网站内容（增强版 - 提取完整元数据）
 * @param url 网站 URL
 * @returns HTML 内容和页面元数据
 */
export async function scrapeWebsite(url: string): Promise<{
  html: string;
  title: string;
  description?: string | null;
  metadata?: {
    ogTitle?: string;
    ogDescription?: string;
    h1?: string;
    appName?: string;
    twitterTitle?: string;
  };
}> {
  // 标准化 URL
  url = normalizeUrl(url);
  
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 设置用户代理
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 访问页面（带重试机制）
    await retryWithDelay(
      () => page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      }),
      2, // 最多重试2次
      2000 // 2秒延迟
    );

    // 获取基本内容
    const html = await page.content();
    const title = await page.title();

    // 提取 meta description
    const description = await page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute('content')
    ).catch(() => undefined);

    // 🌟 提取更多元数据（用于优化AI分析）
    const metadata: any = {};

    // Open Graph title
    metadata.ogTitle = await page.$eval(
      'meta[property="og:title"]',
      (el) => el.getAttribute('content')
    ).catch(() => undefined);

    // Open Graph description
    metadata.ogDescription = await page.$eval(
      'meta[property="og:description"]',
      (el) => el.getAttribute('content')
    ).catch(() => undefined);

    // H1 标签（通常是页面主标题）
    metadata.h1 = await page.$eval(
      'h1',
      (el) => el.textContent?.trim()
    ).catch(() => undefined);

    // Application name
    metadata.appName = await page.$eval(
      'meta[name="application-name"]',
      (el) => el.getAttribute('content')
    ).catch(() => undefined);

    // Apple mobile web app title
    const appleTitle = await page.$eval(
      'meta[name="apple-mobile-web-app-title"]',
      (el) => el.getAttribute('content')
    ).catch(() => undefined);
    if (appleTitle) metadata.appName = appleTitle;

    // Twitter title
    metadata.twitterTitle = await page.$eval(
      'meta[name="twitter:title"]',
      (el) => el.getAttribute('content')
    ).catch(() => undefined);

    console.log('📊 提取的元数据:', {
      title,
      ogTitle: metadata.ogTitle,
      h1: metadata.h1,
      appName: metadata.appName,
    });

    return { html, title, description, metadata };
  } catch (error: any) {
    const errorMessage = error.message || '未知错误';
    console.error(`❌ 爬取网站失败: ${url}`);
    console.error(`   错误类型: ${error.name || 'Error'}`);
    console.error(`   错误详情: ${errorMessage}`);
    
    // 提供更友好的错误信息
    if (errorMessage.includes('timeout')) {
      throw new Error(`网站访问超时: ${url}`);
    } else if (errorMessage.includes('net::ERR') || errorMessage.includes('ERR_')) {
      throw new Error(`网络连接失败: ${url}`);
    } else if (errorMessage.includes('Cannot navigate')) {
      throw new Error(`无效的网址: ${url}`);
    } else {
      throw new Error(`爬取失败: ${errorMessage}`);
    }
  } finally {
    await page.close().catch(() => {
      // 忽略关闭页面时的错误
    });
  }
}

/**
 * 截取网站截图（完美版本）
 * @param url 网站 URL
 * @param options 截图选项
 * @returns 截图 Buffer
 */
export async function takeScreenshot(
  url: string,
  options: {
    maxRetries?: number;
    waitTime?: number;
    fullPage?: boolean;
  } = {}
): Promise<Buffer> {
  const {
    maxRetries = 3, // 增加到 3 次重试
    waitTime = 5000,
    fullPage = false,
  } = options;

  // 标准化 URL
  url = normalizeUrl(url);
  
  let lastError: Error | null = null;

  // 重试机制
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📸 截图尝试 ${attempt}/${maxRetries}: ${url}`);
      const screenshot = await takeScreenshotOnce(url, { waitTime, fullPage });
      console.log(`✅ 截图成功: ${url}`);
      return screenshot;
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️  截图尝试 ${attempt} 失败:`, error.message);
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        const retryDelay = 2000 * attempt; // 递增延迟
        console.log(`   等待 ${retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // 所有尝试都失败
  throw new Error(`截图失败（已重试${maxRetries}次）: ${lastError?.message || '未知错误'}`);
}

/**
 * 执行一次截图（内部函数）
 */
async function takeScreenshotOnce(
  url: string,
  options: { waitTime: number; fullPage: boolean }
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // ==================== 1. 页面初始化配置 ====================
    
    // 设置视口大小（1920x1080 - 标准桌面尺寸）
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // 设置真实的 User-Agent（模拟 Chrome）
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 设置额外的请求头（更像真实浏览器）
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // 启用 JavaScript（确保）
    await page.setJavaScriptEnabled(true);

    // ==================== 2. 反爬虫对抗 ====================
    
    // 在页面加载前注入脚本，隐藏 Puppeteer 特征
    await page.evaluateOnNewDocument(() => {
      // 隐藏 webdriver 标识
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // 隐藏 Puppeteer 特征
      (window as any).chrome = {
        runtime: {},
      };

      // 修改 permissions API
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters);

      // 隐藏自动化标识
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en-US', 'en'],
      });
    });

    // ==================== 3. 页面加载 ====================
    
    console.log('   - 正在访问页面...');
    
    // 访问页面，使用多重降级策略
    let pageLoaded = false;
    
    // 策略 1: 完整等待（60秒）
    try {
      await page.goto(url, {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
        timeout: 60000, // 增加到 60 秒
      });
      pageLoaded = true;
      console.log('   - 页面完全加载完成');
    } catch (error: any) {
      console.log('   - networkidle0 超时，尝试降级策略...');
      
      // 策略 2: 降级到 networkidle2（45秒）
      try {
        await page.goto(url, {
          waitUntil: ['load', 'networkidle2'],
          timeout: 45000,
        });
        pageLoaded = true;
        console.log('   - 页面加载完成（降级策略 1）');
      } catch (error2: any) {
        console.log('   - networkidle2 超时，尝试最低策略...');
        
        // 策略 3: 只等待 DOM 加载（30秒）
        try {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          pageLoaded = true;
          console.log('   - 页面基础加载完成（降级策略 2）');
          // DOM 加载后额外等待 5 秒让资源加载
          await page.waitForTimeout(5000);
        } catch (error3: any) {
          // 策略 4: 如果连 DOM 都加载不了，检查页面是否已经有部分内容
          console.log('   - 页面加载超时，尝试使用当前状态...');
          
          // 检查是否已经有内容
          const hasContent = await page.evaluate(() => {
            return document.body && document.body.innerHTML.length > 0;
          }).catch(() => false);
          
          if (hasContent) {
            pageLoaded = true;
            console.log('   ⚠️  使用部分加载的内容（降级策略 3）');
            await page.waitForTimeout(3000); // 再等 3 秒
          } else {
            // 完全失败
            throw new Error('页面加载超时且无内容');
          }
        }
      }
    }

    if (!pageLoaded) {
      throw new Error('页面加载失败');
    }

    // ==================== 4. 移除干扰元素 ====================
    
    console.log('   - 移除弹窗和遮罩层...');
    await page.evaluate(() => {
      // 移除常见的弹窗、Cookie 提示、登录墙
      const selectorsToRemove = [
        // Cookie 同意弹窗
        '[class*="cookie"]',
        '[id*="cookie"]',
        '[class*="gdpr"]',
        '[id*="gdpr"]',
        // 订阅弹窗
        '[class*="subscribe"]',
        '[class*="newsletter"]',
        '[id*="subscribe"]',
        // 通用弹窗
        '[class*="modal"]',
        '[class*="popup"]',
        '[class*="overlay"]',
        '[role="dialog"]',
        // 登录提示
        '[class*="login-wall"]',
        '[class*="auth-wall"]',
      ];

      selectorsToRemove.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            // 只移除固定定位或绝对定位的元素（弹窗通常是这样）
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'absolute') {
              (el as HTMLElement).remove();
            }
          });
        } catch (e) {
          // 忽略错误
        }
      });

      // 移除 body 的 overflow:hidden（有些弹窗会锁定滚动）
      document.body.style.overflow = 'auto';
      
      // 移除高层级的遮罩层
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        if (zIndex > 9999 && (style.position === 'fixed' || style.position === 'absolute')) {
          (el as HTMLElement).remove();
        }
      });
    });

    // ==================== 5. 滚动页面触发懒加载 ====================
    
    console.log('   - 滚动页面触发懒加载...');
    await autoScroll(page);

    // ==================== 6. 等待内容加载 ====================
    
    console.log('   - 等待页面内容稳定...');
    
    // 等待 body 有实际内容
    await page.waitForFunction(
      () => {
        const bodyText = document.body.innerText || '';
        return bodyText.length > 100; // 至少有 100 个字符
      },
      { timeout: 10000 }
    ).catch(() => {
      console.warn('   ⚠️  页面内容较少，继续截图');
    });

    // 等待图片加载完成（宽容策略）
    console.log('   - 等待图片加载...');
    await page.evaluate(() => {
      return Promise.race([
        // 等待所有图片
        Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => 
              new Promise(resolve => {
                img.onload = img.onerror = resolve;
                // 每张图片 3 秒超时
                setTimeout(resolve, 3000);
              })
            )
        ),
        // 整体 10 秒超时
        new Promise(resolve => setTimeout(resolve, 10000))
      ]);
    }).catch(() => {
      console.log('   ⚠️  图片加载超时，继续截图');
    });

    // 额外等待时间（让动画完成、字体加载等）
    console.log(`   - 额外等待 ${options.waitTime}ms...`);
    await page.waitForTimeout(options.waitTime);

    // ==================== 7. 最终准备 ====================
    
    // 滚动回顶部（确保截取首屏）
    if (!options.fullPage) {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(500);
    }

    // ==================== 8. 截图 ====================
    
    console.log('   - 正在截图...');
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: options.fullPage,
      // 优化截图质量
      captureBeyondViewport: false,
      // 剪裁掉可能的白边（如果需要）
      clip: options.fullPage ? undefined : {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      },
    });

    return screenshot as Buffer;
  } catch (error: any) {
    console.error(`❌ 截图执行失败: ${url}`, error.message);
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * 自动滚动页面（触发懒加载）
 */
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300; // 每次滚动 300px
      const maxScrolls = 10; // 最多滚动 10 次
      let scrolls = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrolls++;

        // 到达底部或达到最大滚动次数
        if (totalHeight >= scrollHeight || scrolls >= maxScrolls) {
          clearInterval(timer);
          // 滚动回顶部
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100); // 每 100ms 滚动一次
    });
  });
}

/**
 * 从目标导航站爬取工具域名列表（增强版 - 支持懒加载和动态内容）
 * @param targetUrl 目标导航站 URL
 * @param selector CSS 选择器（用于定位链接，暂不使用）
 * @returns 域名列表
 */
export async function scrapeToolDomains(
  targetUrl: string,
  selector: string = 'a[href]'
): Promise<string[]> {
  // 标准化 URL
  targetUrl = normalizeUrl(targetUrl);
  
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    
    console.log(`   📄 正在加载页面...`);
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 设置更大的视口，确保能看到更多内容
    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 初始等待
    await page.waitForTimeout(3000);

    console.log(`   📜 智能加载页面内容（自适应策略）...`);
    
    // 自适应加载策略：循环滚动直到内容不再增加
    let previousLinkCount = 0;
    let stableCount = 0; // 连续稳定次数
    const maxAttempts = 5; // 最多尝试 5 轮
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`   🔄 第 ${attempt}/${maxAttempts} 轮加载...`);
      
      // 1. 滚动页面
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let scrollCount = 0;
          const maxScrolls = 15; // 每轮滚动 15 次
          const distance = 500;

          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            scrollCount++;

            if (scrollCount >= maxScrolls || window.scrollY + window.innerHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              setTimeout(() => resolve(), 500);
            }
          }, 150);
        });
      });
      
      // 2. 等待内容加载
      await page.waitForTimeout(2000);
      
      // 3. 统计当前链接数量
      const currentLinkCount = await page.evaluate(() => {
        return document.querySelectorAll('a[href]').length;
      });
      
      console.log(`      当前链接数: ${currentLinkCount} (上一轮: ${previousLinkCount})`);
      
      // 4. 判断是否有新内容
      if (currentLinkCount === previousLinkCount) {
        stableCount++;
        console.log(`      ⚠️ 链接数量未增加 (稳定次数: ${stableCount}/2)`);
        
        // 如果连续 2 次没有新内容，尝试点击"加载更多"按钮
        if (stableCount === 1) {
          console.log(`      🔘 尝试查找并点击"加载更多"按钮...`);
          const clicked = await page.evaluate(() => {
            const loadMoreTexts = [
              'load more', 'show more', 'view more', 'see more',
              '加载更多', '查看更多', '显示更多', 'more', 'next',
            ];

            const clickableElements = Array.from(
              document.querySelectorAll('button, a, div[role="button"], span[role="button"]')
            );
            
            for (const el of clickableElements) {
              const text = (el.textContent || '').toLowerCase().trim();
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              
              if (loadMoreTexts.some(t => text.includes(t) || ariaLabel.includes(t))) {
                // 检查元素是否可见
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                
                if (isVisible) {
                  (el as HTMLElement).click();
                  return true;
                }
              }
            }
            return false;
          });
          
          if (clicked) {
            console.log(`      ✅ 已点击按钮，等待新内容加载...`);
            await page.waitForTimeout(3000);
            stableCount = 0; // 重置稳定计数
            continue; // 重新开始这一轮
          } else {
            console.log(`      ℹ️ 未找到"加载更多"按钮`);
          }
        }
        
        // 如果连续 2 次稳定，认为已经加载完成
        if (stableCount >= 2) {
          console.log(`   ✅ 内容已完全加载（连续 ${stableCount} 次无变化）`);
          break;
        }
      } else {
        // 有新内容，重置稳定计数
        stableCount = 0;
        console.log(`      ✅ 新增 ${currentLinkCount - previousLinkCount} 个链接`);
      }
      
      previousLinkCount = currentLinkCount;
      
      // 如果是最后一轮，额外等待
      if (attempt === maxAttempts) {
        console.log(`   ⏳ 最后一轮，额外等待 3 秒...`);
        await page.waitForTimeout(3000);
      }
    }
    
    console.log(`   ✅ 智能加载完成，最终链接数: ${previousLinkCount}`);

    console.log(`   🔍 正在提取工具链接...`);

    // 在页面上下文中执行提取逻辑
    const { links: allLinks, debugInfo } = await page.evaluate((targetUrl) => {
      const links = new Set<string>();
      const anchors = document.querySelectorAll('a');
      const debugSamples: string[] = [];
      const attributeStats: Record<string, number> = {};
      
      anchors.forEach((anchor, index) => {
        try {
          const href = anchor.href;
          const rawHref = anchor.getAttribute('href');
          const dataHref = anchor.getAttribute('data-href');
          const dataUrl = anchor.getAttribute('data-url');
          const dataLink = anchor.getAttribute('data-link');
          const dataSrc = anchor.getAttribute('data-src');
          
          // 统计属性
          if (dataHref) attributeStats['data-href'] = (attributeStats['data-href'] || 0) + 1;
          if (dataUrl) attributeStats['data-url'] = (attributeStats['data-url'] || 0) + 1;
          if (dataLink) attributeStats['data-link'] = (attributeStats['data-link'] || 0) + 1;
          if (dataSrc) attributeStats['data-src'] = (attributeStats['data-src'] || 0) + 1;
          
          // 收集前30个链接用于调试（优先显示有 data-* 属性的）
          if (debugSamples.length < 30) {
            // 优先收集有 data 属性的链接
            const hasDataAttr = dataHref || dataUrl || dataLink || dataSrc;
            if (hasDataAttr || debugSamples.length < 15) {
              let debug = `[${index}] href="${href.substring(0, 60)}"`;
              if (dataUrl) debug += ` 🔗data-url="${dataUrl}"`;
              if (dataHref) debug += ` 🔗data-href="${dataHref}"`;
              if (dataLink) debug += ` 🔗data-link="${dataLink}"`;
              debugSamples.push(debug);
            }
          }
          
          // 尝试多个来源
          const possibleUrls = [
            href,
            dataHref,
            dataUrl,
            dataLink,
            dataSrc
          ].filter(Boolean);
          
          possibleUrls.forEach(url => {
            if (url && url !== 'null' && url !== 'undefined' && 
                (url.startsWith('http://') || url.startsWith('https://'))) {
              try {
                const urlObj = new URL(url);
                // 只要外部链接
                if (urlObj.hostname !== new URL(targetUrl).hostname) {
                  links.add(urlObj.origin);
                }
              } catch (e) {
                // 忽略
              }
            }
          });
        } catch (e) {
          // 忽略无效 URL
        }
      });
      
      return {
        links: Array.from(links),
        debugInfo: {
          totalAnchors: anchors.length,
          samples: debugSamples,
          attributeStats
        }
      };
    }, targetUrl);

    console.log(`   🔎 页面统计:`);
    console.log(`      - 总共 ${debugInfo.totalAnchors} 个 <a> 标签`);
    console.log(`      - 提取到 ${allLinks.length} 个外部链接`);
    
    // 显示 data-* 属性统计
    const hasDataAttrs = Object.keys(debugInfo.attributeStats).length > 0;
    if (hasDataAttrs) {
      console.log(`   📊 Data 属性统计:`);
      Object.entries(debugInfo.attributeStats).forEach(([attr, count]) => {
        console.log(`      - ${attr}: ${count} 个`);
      });
    }
    
    if (debugInfo.samples.length > 0) {
      console.log(`   📝 链接示例（优先显示有 data-* 属性的，共 ${debugInfo.samples.length} 个）:`);
      debugInfo.samples.forEach((sample) => {
        console.log(`      ${sample}`);
      });
    }

    console.log(`   📊 开始过滤外部链接...`);

    // 过滤有效的工具 URL（记录被过滤的原因）
    const validLinks: string[] = [];
    const filteredOut: { link: string; reason: string }[] = [];
    
    allLinks.forEach(link => {
      if (!link || link === 'null' || link === 'undefined') {
        filteredOut.push({ link, reason: '空值或null' });
      } else if (!isValidToolUrl(link)) {
        // 找出被过滤的原因
        let reason = '未知原因';
        if (link.includes('alicdn.com') || link.includes('cdn.')) {
          reason = 'CDN域名';
        } else if (link.includes('facebook.com') || link.includes('twitter.com')) {
          reason = '社交媒体';
        } else if (link.includes('beian.')) {
          reason = '备案网站';
        }
        filteredOut.push({ link, reason });
      } else {
        validLinks.push(link);
      }
    });
    
    console.log(`   ✅ 过滤后剩余 ${validLinks.length} 个有效链接`);
    
    if (filteredOut.length > 0 && filteredOut.length <= 10) {
      console.log(`   ⚠️  被过滤的链接 (${filteredOut.length} 个):`);
      filteredOut.forEach((item, i) => {
        console.log(`      [${i + 1}] ${item.link} (原因: ${item.reason})`);
      });
    } else if (filteredOut.length > 10) {
      console.log(`   ⚠️  ${filteredOut.length} 个链接被过滤（前5个）:`);
      filteredOut.slice(0, 5).forEach((item, i) => {
        console.log(`      [${i + 1}] ${item.link} (原因: ${item.reason})`);
      });
    }
    return validLinks;
  } catch (error: any) {
    console.error(`❌ 爬取域名列表失败: ${targetUrl}`);
    console.error(`   错误: ${error.message}`);
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * 🎯 Toolify.ai 两步采集（预设）
 * 步骤1：从列表页提取工具详情页链接
 * 步骤2：访问详情页提取真实工具官网链接
 */
export async function scrapeToolifyAi(
  targetUrl: string,
  shouldStopCheck?: () => boolean,
  toolLimit?: number,
  shouldPauseCheck?: () => boolean,
  onBatchExtracted?: (urls: string[]) => Promise<void>
): Promise<string[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('   📄 [步骤1] 正在加载列表页...');
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    await page.setViewport({
      width: 1920,
      height: 1080,
    });
    
    // 关键：等待 DOM 加载完成
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    console.log('   ⏳ 等待 React 应用渲染...');
    
    // 等待工具卡片出现（React 渲染需要时间）
    try {
      await page.waitForSelector('a[href*="/tool/"]', { timeout: 10000 });
      console.log('   ✅ 工具卡片已加载');
    } catch (e) {
      console.log('   ⚠️  等待工具卡片超时，尝试继续...');
    }
    
    // 额外等待确保内容完全渲染
    await page.waitForTimeout(5000);
    
    console.log('   📜 [步骤1] 智能加载页面内容...');
    
    // 滚动加载更多内容
    let previousLinkCount = 0;
    let stableCount = 0;
    const maxAttempts = 5;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`   🔄 第 ${attempt}/${maxAttempts} 轮加载...`);
      
      // 滚动页面
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let scrollCount = 0;
          const maxScrolls = 15;
          const distance = 500;
          
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            scrollCount++;
            
            if (scrollCount >= maxScrolls || window.scrollY + window.innerHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              setTimeout(() => resolve(), 500);
            }
          }, 150);
        });
      });
      
      await page.waitForTimeout(2000);
      
      // 统计链接数量
      const currentLinkCount = await page.evaluate(() => {
        return document.querySelectorAll('a[href^="/zh/tool/"], a[href^="/tool/"]').length;
      });
      
      console.log(`      当前工具详情页链接数: ${currentLinkCount} (上一轮: ${previousLinkCount})`);
      
      if (currentLinkCount === previousLinkCount) {
        stableCount++;
        if (stableCount >= 2) {
          console.log(`   ✅ 内容已完全加载`);
          break;
        }
      } else {
        stableCount = 0;
        console.log(`      ✅ 新增 ${currentLinkCount - previousLinkCount} 个链接`);
      }
      
      previousLinkCount = currentLinkCount;
    }
    
    // 提取工具详情页链接
    console.log('   🔍 [步骤1] 提取工具详情页链接...');
    
    let { detailPageUrls, debugInfo } = await page.evaluate((baseUrl) => {
      const links = new Set<string>();
      const allLinks = document.querySelectorAll('a[href]');
      
      console.log('🔍 页面调试:', {
        totalLinks: allLinks.length,
        baseUrl
      });
      
      // 遍历所有链接，找出包含 /tool/ 的
      allLinks.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        const fullHref = (anchor as HTMLAnchorElement).href;
        
        // 检查是否是工具详情页链接
        if (href && (href.includes('/tool/') || fullHref.includes('/tool/'))) {
          try {
            let finalUrl = fullHref;
            // 如果是相对路径，构建完整 URL
            if (href.startsWith('/')) {
              finalUrl = new URL(href, baseUrl).href;
            }
            
            // 只保留 toolify.ai 的工具详情页
            if (finalUrl.includes('toolify.ai') && finalUrl.includes('/tool/')) {
              links.add(finalUrl);
            }
          } catch (e) {
            console.error('URL 解析失败:', href, e);
          }
        }
      });
      
      const linksArray = Array.from(links);
      
      return {
        detailPageUrls: linksArray,
        debugInfo: {
          totalLinks: allLinks.length,
          foundToolLinks: linksArray.length,
          samples: linksArray.slice(0, 3)
        }
      };
    }, targetUrl);
    
    console.log('   📊 调试信息:', JSON.stringify(debugInfo, null, 2));
    console.log(`   ✅ [步骤1] 找到 ${detailPageUrls.length} 个工具详情页`);
    
    if (detailPageUrls.length === 0) {
      console.log('   ⚠️  未找到工具详情页链接，返回空数组');
      return [];
    }
    
    // 应用数量限制（在步骤1后立即限制，避免无用的详情页访问）
    if (toolLimit && detailPageUrls.length > toolLimit) {
      console.log(`   ⚠️  找到 ${detailPageUrls.length} 个工具，根据限制只处理前 ${toolLimit} 个`);
      detailPageUrls = detailPageUrls.slice(0, toolLimit);
    }
    
    // 关闭列表页
    await page.close();
    
    // 步骤2：访问每个详情页，提取真实工具链接
    console.log('   🔗 [步骤2] 开始提取工具官网链接...');
    
    const officialUrls: string[] = [];
    const batchSize = 5; // 每批处理5个，确保稳定性
    
    for (let i = 0; i < detailPageUrls.length; i += batchSize) {
      // 检查是否应该终止
      if (shouldStopCheck && shouldStopCheck()) {
        console.log('   🛑 检测到终止信号，停止提取工具链接');
        break;
      }
      
      const batch = detailPageUrls.slice(i, i + batchSize);
      console.log(`   📦 处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(detailPageUrls.length / batchSize)} (${batch.length} 个)`);
      
      // 并发处理当前批次，传递终止检查函数
      const batchResults = await Promise.all(
        batch.map(detailUrl => extractOfficialUrlFromToolifyDetail(detailUrl, shouldStopCheck))
      );
      
      // 收集有效链接
      const batchUrls: string[] = [];
      batchResults.forEach((url, index) => {
        if (url) {
          officialUrls.push(url);
          batchUrls.push(url);
          console.log(`      ✅ [${i + index + 1}/${detailPageUrls.length}] ${url}`);
        } else {
          console.log(`      ⚠️  [${i + index + 1}/${detailPageUrls.length}] 未找到官网链接`);
        }
      });
      
      // 如果有回调函数，立即处理这批链接（流式处理）
      if (onBatchExtracted && batchUrls.length > 0) {
        console.log(`   🚀 [流式处理] 立即处理批次 ${Math.floor(i / batchSize) + 1} 的 ${batchUrls.length} 个链接...`);
        await onBatchExtracted(batchUrls);
      } else if (!onBatchExtracted) {
        console.log(`   ⚠️  未传递批次回调函数，跳过流式处理`);
      }
      
      // 批次间延迟，避免请求过快触发反爬虫
      if (i + batchSize < detailPageUrls.length) {
        console.log(`   ⏳ 等待 5 秒后继续下一批...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log(`   🎉 [步骤2] 成功提取 ${officialUrls.length}/${detailPageUrls.length} 个工具官网链接`);
    
    return officialUrls;
    
  } catch (error: any) {
    console.error(`❌ Toolify.ai 两步采集失败: ${error.message}`);
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * 爬虫核心逻辑
 * 负责页面加载、内容提取、链接过滤等
 * 更新时间: 2025-11-27 17:42 - 批次大小改为5
 */
// 添加注释强制重新编译
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractOfficialUrlFromToolifyDetail(
  detailUrl: string,
  shouldStopCheck?: () => boolean
): Promise<string | null> {
  // 访问前先检查终止信号
  if (shouldStopCheck && shouldStopCheck()) {
    return null;
  }
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    await page.goto(detailUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    // 加载后再次检查终止信号
    if (shouldStopCheck && shouldStopCheck()) {
      await page.close();
      return null;
    }
    
    await page.waitForTimeout(2000);
    
    // 提取官网链接（多种策略）
    const officialUrl = await page.evaluate(() => {
      // 策略1：查找 target="_blank" 的外部链接（最常见）
      const externalLinks = Array.from(document.querySelectorAll('a[target="_blank"][href^="http"]'));
      
      // 过滤掉社交媒体等无关链接
      const excludeDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'toolify.ai'];
      
      // 移除 UTM 参数的函数
      const cleanUrl = (url: string): string => {
        try {
          const urlObj = new URL(url);
          // 移除所有 UTM 参数
          urlObj.searchParams.delete('utm_source');
          urlObj.searchParams.delete('utm_medium');
          urlObj.searchParams.delete('utm_campaign');
          urlObj.searchParams.delete('utm_term');
          urlObj.searchParams.delete('utm_content');
          return urlObj.toString();
        } catch (e) {
          return url;
        }
      };
      
      for (const link of externalLinks) {
        const href = (link as HTMLAnchorElement).href;
        const isExcluded = excludeDomains.some(domain => href.includes(domain));
        
        if (!isExcluded) {
          // 找到第一个有效的外部链接，并清理 UTM 参数
          return cleanUrl(href);
        }
      }
      
      // 策略2：查找包含 "官网"、"访问" 等关键词的链接
      const keywords = ['官网', '访问网站', 'visit', 'website', 'official'];
      for (const link of externalLinks) {
        const text = (link.textContent || '').toLowerCase();
        const hasKeyword = keywords.some(kw => text.includes(kw.toLowerCase()));
        
        if (hasKeyword) {
          const href = (link as HTMLAnchorElement).href;
          const isExcluded = excludeDomains.some(domain => href.includes(domain));
          if (!isExcluded) {
            return cleanUrl(href);
          }
        }
      }
      
      // 策略3：查找特定 class 的链接
      const toolInfoLink = document.querySelector('.tool-detail-info-url a[href^="http"]');
      if (toolInfoLink) {
        return cleanUrl((toolInfoLink as HTMLAnchorElement).href);
      }
      
      return null;
    });
    
    return officialUrl;
    
  } catch (error: any) {
    console.error(`   ❌ 提取详情页链接失败 (${detailUrl}): ${error.message}`);
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * 验证是否为有效的工具 URL
 */
function isValidToolUrl(url: string): boolean {
  if (!url) return false;
  
  // 排除无效链接
  const invalidPatterns = [
    'javascript:',
    'mailto:',
    'tel:',
    '#',
    'about:',
    '//',  // 协议相对链接
  ];

  if (invalidPatterns.some(pattern => url.startsWith(pattern))) {
    return false;
  }

  // 排除常见的非工具网站域名
  const excludeDomains = [
    'alicdn.com',
    'cdn.',
    'static.',
    'beian.miit.gov.cn',
    'beian.gov.cn',
    'icp.gov.cn',
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'instagram.com',
    'youtube.com',
    'github.com',
    'jsdelivr.net',
    'unpkg.com',
    'weixin.qq.com',
    '163.com',
    'sina.com',
    'douyin.com',
    'tiktok.com',
  ];

  const urlLower = url.toLowerCase();
  if (excludeDomains.some(domain => urlLower.includes(domain))) {
    return false;
  }

  // 排除常见的非工具路径
  const excludePaths = [
    '/about',
    '/privacy',
    '/terms',
    '/contact',
    '/login',
    '/register',
    '/signup',
    '/signin',
    '/blog',
    '/news',
    '/article',
    '/post',
  ];

  if (excludePaths.some(path => urlLower.includes(path))) {
    return false;
  }

  return true;
}

/**
 * 规范化域名
 * @param url 完整 URL
 * @returns 规范化的域名（去除 www）
 */
export function normalizeDomain(url: string): string {
  try {
    // 先标准化 URL（确保有协议）
    const fullUrl = normalizeUrl(url);
    const parsedUrl = new URL(fullUrl);
    let hostname = parsedUrl.hostname;
    
    // 去除 www
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch (error) {
    // 如果还是失败，尝试简单处理
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return cleanUrl || url;
  }
}

/**
 * 提取网站 Logo URL
 * @param url 网站 URL
 * @param htmlContent 可选的 HTML 内容（如果已经爬取过，避免重复）
 */
export async function extractLogoUrl(url: string, htmlContent?: string): Promise<string | null> {
  try {
    // 标准化 URL
    url = normalizeUrl(url);
    
    // 如果没有提供 HTML，则爬取
    let html = htmlContent;
    if (!html) {
      const result = await scrapeWebsite(url);
      html = result.html;
    }

    // 使用正则表达式提取 Logo（优先级从高到低）
    const logoPatterns = [
      // Apple touch icon（最优先，通常是真正的 Logo）
      /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i,
      /<link[^>]+rel=["']apple-touch-icon-precomposed["'][^>]+href=["']([^"']+)["']/i,
      // 标准 favicon（各种尺寸，优先大尺寸）
      /<link[^>]+rel=["']icon["'][^>]+sizes=["']512x512["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["']icon["'][^>]+sizes=["']256x256["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["']icon["'][^>]+sizes=["']192x192["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["']icon["'][^>]+sizes=["']180x180["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["']icon["'][^>]+sizes=["']96x96["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["']icon["'][^>]+sizes=["']32x32["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["']/i,
      // Shortcut icon
      /<link[^>]+rel=["']shortcut icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']shortcut icon["']/i,
      // Mask icon (Safari)
      /<link[^>]+rel=["']mask-icon["'][^>]+href=["']([^"']+)["']/i,
      // Fluid icon
      /<link[^>]+rel=["']fluid-icon["'][^>]+href=["']([^"']+)["']/i,
      // OG image（降低优先级，因为通常是截图而非 Logo）
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      // Twitter image（最低优先级）
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    const candidates: string[] = [];

    // 收集所有匹配的 logo URL
    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        try {
          const fullUrl = new URL(match[1], url).href;
          if (!candidates.includes(fullUrl)) {
            candidates.push(fullUrl);
          }
        } catch {
          continue;
        }
      }
    }

    // 尝试验证第一个候选 URL 是否可访问
    if (candidates.length > 0) {
      for (const candidate of candidates) {
        try {
          const response = await axios.head(candidate, { timeout: 5000 });
          if (response.status === 200) {
            console.log(`✅ Logo 提取成功: ${candidate}`);
            return candidate;
          }
        } catch {
          continue;
        }
      }
      // 如果验证失败，返回第一个候选（可能是相对路径或重定向）
      console.log(`⚠️ Logo URL 验证失败，返回第一个候选: ${candidates[0]}`);
      return candidates[0];
    }

    // 尝试默认的 favicon.ico
    const defaultFavicon = new URL('/favicon.ico', url).href;
    try {
      const response = await axios.head(defaultFavicon, { timeout: 5000 });
      if (response.status === 200) {
        console.log(`✅ 使用默认 favicon.ico: ${defaultFavicon}`);
        return defaultFavicon;
      }
    } catch {
      // favicon.ico 不存在
    }

    console.log(`❌ 未找到 Logo`);
    return null;
  } catch (error: any) {
    console.error(`❌ Logo 提取失败:`, error.message);
    return null;
  }
}

