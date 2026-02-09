import axios, { AxiosInstance } from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://boult-india-bakend-new.onrender.com';
const MAX_RETRIES = 5; // Increased retries for Render
const RETRY_DELAY = 2000; // Increased delay for cold starts

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BACKEND_URL,
      timeout: 30000, // Increased timeout for Render cold starts
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.response.use(
      response => response,
      error => {
        if (error.code === 'ECONNABORTED') {
          console.error('API Timeout - Backend might be sleeping on Render');
        } else {
          console.error('API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries = MAX_RETRIES
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.retryRequest(fn, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error.response) return true; // Network errors
    const status = error.response.status;
    // Retry on timeout, rate limit, and server errors
    return status === 408 || status === 429 || status >= 500 || error.code === 'ECONNABORTED';
  }

  async getOrders(): Promise<any[]> {
    try {
      console.log('🔍 Admin API: Fetching orders from', BACKEND_URL);
      const response = await this.retryRequest(() =>
        this.api.get('/api/orders')
      );
      console.log('🔍 Admin API: Orders response:', response.data);
      console.log('🔍 Admin API: Orders count:', response.data.orders?.length || 0);
      return response.data.orders || [];
    } catch (error) {
      console.error('❌ Admin API: Failed to fetch orders:', error);
      console.error('❌ Admin API: Error details:', error.response?.data || error.message);
      return [];
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      const response = await this.retryRequest(() =>
        this.api.get('/api/products')
      );
      return response.data.products || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  async saveProduct(product: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.post('/api/products', product)
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to save product:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to save product',
      };
    }
  }

  async updateProduct(product: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.put('/api/products', product)
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to update product:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update product',
      };
    }
  }

  async deleteProduct(productId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.delete('/api/products', { data: { id: productId } })
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete product',
      };
    }
  }

  async getOrderById(orderId: string): Promise<any | null> {
    try {
      const response = await this.retryRequest(() =>
        this.api.get(`/api/orders/${orderId}`)
      );
      return response.data.order || null;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return null;
    }
  }

  async saveOrder(order: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.post('/api/save-order', order)
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to save order:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to save order',
      };
    }
  }

  async updateOrder(orderId: string, updates: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.put('/api/update-order', { orderId, ...updates })
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to update order:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update order',
      };
    }
  }

  async deleteOrder(orderId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.delete('/api/delete-order', { data: { orderId } })
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete order',
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`, {
        timeout: 45000, // Increased timeout for Render cold starts
      });
      return response.data.status?.includes('Backend is running') || false;
    } catch (error: any) {
      console.error('Backend health check failed:', error.message);
      if (error.code === 'ECONNABORTED') {
        console.warn('Backend timeout - Render service might be sleeping');
      }
      return false;
    }
  }

  async wakeUpBackend(): Promise<void> {
    console.log('🔄 Waking up backend service...');
    try {
      // Make multiple concurrent requests to wake up faster with longer timeout
      const wakeUpPromises = Array(2).fill(0).map(() => 
        axios.get(`${BACKEND_URL}/health`, { timeout: 60000 })
      );
      
      await Promise.race(wakeUpPromises);
      console.log('✅ Backend is awake!');
    } catch (error) {
      console.warn('⚠️ Backend wake-up attempt failed, but it might still be starting...');
    }
  }

  async uploadImage(file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      // For now, let's use a simple approach - just use the filename without actual upload
      // In production, you'd want to use cloud storage like AWS S3, Cloudinary, etc.
      
      // Generate a simple image URL based on filename
      const timestamp = Date.now();
      const imageUrl = `/uploads/${timestamp}-${file.name}`;
      
      console.log('🖼️ Image upload simulated:', imageUrl);
      
      // TODO: In production, implement actual file upload to cloud storage
      
      return {
        success: true,
        imageUrl: imageUrl,
      };
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload image',
      };
    }
  }

  // ============ BANNERS API ============

  async getBanners(): Promise<any[]> {
    try {
      const response = await this.retryRequest(() =>
        this.api.get('/api/banners')
      );
      return response.data.banners || [];
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      return [];
    }
  }

  async saveBanner(banner: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.post('/api/banners', banner)
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to save banner:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to save banner',
      };
    }
  }

  async updateBanner(banner: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.put('/api/banners', banner)
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to update banner:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update banner',
      };
    }
  }

  async deleteBanner(bannerId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.retryRequest(() =>
        this.api.delete('/api/banners', { data: { id: bannerId } })
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.data.timestamp,
      };
    } catch (error: any) {
      console.error('Failed to delete banner:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete banner',
      };
    }
  }
}

export const apiService = new ApiService();
