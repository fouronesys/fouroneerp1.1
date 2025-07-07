import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class IndexNowService {
  private static instance: IndexNowService;
  private apiKey: string;
  private host: string;
  private keyFile: string;

  private constructor() {
    // Generate a unique API key for IndexNow
    this.apiKey = crypto.randomBytes(32).toString('hex');
    this.host = 'fourone.com.do';
    this.keyFile = `${this.apiKey}.txt`;
    
    // Create the key file in public directory
    this.createKeyFile();
  }

  public static getInstance(): IndexNowService {
    if (!IndexNowService.instance) {
      IndexNowService.instance = new IndexNowService();
    }
    return IndexNowService.instance;
  }

  private createKeyFile(): void {
    try {
      const publicDir = path.resolve('client/public');
      const keyFilePath = path.join(publicDir, this.keyFile);
      
      // Ensure public directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Write the API key to the file
      fs.writeFileSync(keyFilePath, this.apiKey, 'utf8');
      console.log(`IndexNow key file created: ${this.keyFile}`);
    } catch (error) {
      console.error('Failed to create IndexNow key file:', error);
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public getKeyFile(): string {
    return this.keyFile;
  }

  /**
   * Submit URLs to IndexNow API for immediate indexing
   */
  public async submitUrls(urls: string[]): Promise<boolean> {
    try {
      const payload = {
        host: this.host,
        key: this.apiKey,
        keyLocation: `https://${this.host}/${this.keyFile}`,
        urlList: urls.map(url => {
          // Ensure URLs are absolute
          if (url.startsWith('/')) {
            return `https://${this.host}${url}`;
          }
          return url;
        })
      };

      // Submit to Bing IndexNow API
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Four One Solutions ERP/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`IndexNow: Successfully submitted ${urls.length} URLs to Bing`);
        return true;
      } else {
        console.error(`IndexNow: Failed to submit URLs. Status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('IndexNow: Error submitting URLs:', error);
      return false;
    }
  }

  /**
   * Submit a single URL for indexing
   */
  public async submitUrl(url: string): Promise<boolean> {
    return this.submitUrls([url]);
  }

  /**
   * Submit common ERP system pages for indexing
   */
  public async submitCommonPages(): Promise<boolean> {
    const commonPages = [
      '/',
      '/auth',
      '/dashboard',
      '/pos',
      '/billing',
      '/products',
      '/customers',
      '/accounting',
      '/reports',
      '/downloads'
    ];

    return this.submitUrls(commonPages);
  }

  /**
   * Submit all main ERP modules for indexing
   */
  public async submitAllModules(): Promise<boolean> {
    const allModules = [
      '/',
      '/auth',
      '/dashboard',
      '/pos',
      '/billing',
      '/products',
      '/customers',
      '/suppliers',
      '/accounting',
      '/reports',
      '/hr',
      '/chat',
      '/ai-insights',
      '/settings',
      '/downloads',
      '/company-settings',
      '/user-management'
    ];

    return this.submitUrls(allModules);
  }
}

export const indexNowService = IndexNowService.getInstance();