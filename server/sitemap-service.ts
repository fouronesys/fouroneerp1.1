import fs from 'fs';
import path from 'path';

export class SitemapService {
  private static instance: SitemapService;
  private baseUrl: string;
  private sitemapPath: string;

  private constructor() {
    this.baseUrl = 'https://fourone.com.do';
    this.sitemapPath = path.resolve('client/public/sitemap.xml');
  }

  public static getInstance(): SitemapService {
    if (!SitemapService.instance) {
      SitemapService.instance = new SitemapService();
    }
    return SitemapService.instance;
  }

  /**
   * Generate XML sitemap for the ERP system
   */
  public generateSitemap(): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const urls = [
      // Main pages
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/auth', priority: '0.8', changefreq: 'monthly' },
      { loc: '/dashboard', priority: '0.9', changefreq: 'daily' },
      
      // Core business modules
      { loc: '/pos', priority: '0.9', changefreq: 'daily' },
      { loc: '/billing', priority: '0.9', changefreq: 'daily' },
      { loc: '/products', priority: '0.8', changefreq: 'weekly' },
      { loc: '/customers', priority: '0.8', changefreq: 'weekly' },
      { loc: '/suppliers', priority: '0.8', changefreq: 'weekly' },
      
      // Accounting and reporting
      { loc: '/accounting', priority: '0.8', changefreq: 'daily' },
      { loc: '/reports', priority: '0.7', changefreq: 'weekly' },
      { loc: '/fiscal-documents', priority: '0.8', changefreq: 'weekly' },
      
      // HR and management
      { loc: '/hr', priority: '0.7', changefreq: 'weekly' },
      { loc: '/inventory', priority: '0.8', changefreq: 'daily' },
      
      // AI and insights
      { loc: '/chat', priority: '0.6', changefreq: 'weekly' },
      { loc: '/ai-insights', priority: '0.6', changefreq: 'weekly' },
      
      // System and settings
      { loc: '/settings', priority: '0.5', changefreq: 'monthly' },
      { loc: '/company-settings', priority: '0.5', changefreq: 'monthly' },
      { loc: '/user-management', priority: '0.5', changefreq: 'monthly' },
      { loc: '/system', priority: '0.4', changefreq: 'monthly' },
      
      // Downloads and resources
      { loc: '/downloads', priority: '0.7', changefreq: 'weekly' },
      
      // Dominican Republic specific features
      { loc: '/dgii-reports', priority: '0.8', changefreq: 'weekly' },
      { loc: '/ncf-management', priority: '0.8', changefreq: 'weekly' },
      { loc: '/rnc-validation', priority: '0.7', changefreq: 'monthly' },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${this.baseUrl}${url.loc}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate and save sitemap to public directory
   */
  public async createSitemapFile(): Promise<void> {
    try {
      const publicDir = path.resolve('client/public');
      
      // Ensure public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const sitemapContent = this.generateSitemap();
      fs.writeFileSync(this.sitemapPath, sitemapContent, 'utf8');
      
      console.log('Sitemap generated successfully at:', this.sitemapPath);
    } catch (error) {
      console.error('Failed to create sitemap file:', error);
    }
  }

  /**
   * Get sitemap content as string
   */
  public getSitemapContent(): string {
    return this.generateSitemap();
  }

  /**
   * Generate robots.txt content
   */
  public generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /api/
Disallow: /uploads/temp/
Disallow: /admin/
Disallow: /private/

# Allow specific important paths
Allow: /uploads/products/
Allow: /uploads/logos/
Allow: /downloads/`;
  }

  /**
   * Create robots.txt file
   */
  public async createRobotsTxtFile(): Promise<void> {
    try {
      const publicDir = path.resolve('client/public');
      const robotsPath = path.join(publicDir, 'robots.txt');
      
      // Ensure public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const robotsContent = this.generateRobotsTxt();
      fs.writeFileSync(robotsPath, robotsContent, 'utf8');
      
      console.log('Robots.txt generated successfully at:', robotsPath);
    } catch (error) {
      console.error('Failed to create robots.txt file:', error);
    }
  }

  /**
   * Update sitemap with dynamic content
   */
  public async updateSitemapWithDynamicContent(): Promise<void> {
    // This method can be extended to include dynamic content like:
    // - Product pages
    // - Customer profiles
    // - Reports
    // - Blog posts or news
    await this.createSitemapFile();
    await this.createRobotsTxtFile();
  }
}

export const sitemapService = SitemapService.getInstance();