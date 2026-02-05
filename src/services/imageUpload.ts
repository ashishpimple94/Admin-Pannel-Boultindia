import axios from 'axios';

// ImgBB API Key - Get from https://api.imgbb.com/
const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY || '848a3f09e48dfcf06ff9c4a71eb7efd3';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload image to ImgBB (free image hosting)
 * @param file - Image file to upload
 * @returns Promise with image URL
 */
export async function uploadToImgBB(file: File): Promise<ImageUploadResult> {
  if (!IMGBB_API_KEY || IMGBB_API_KEY.includes('placeholder')) {
    return {
      success: false,
      error: 'ImgBB API key not configured. Please add REACT_APP_IMGBB_API_KEY to .env.local'
    };
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Please select an image file'
    };
  }

  // Check file size (max 32MB for ImgBB)
  if (file.size > 32 * 1024 * 1024) {
    return {
      success: false,
      error: 'Image size must be less than 32MB'
    };
  }

  try {
    const formData = new FormData();
    formData.append('image', file);

    console.log('📤 Uploading image to ImgBB...');

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (response.data.success) {
      const imageUrl = response.data.data.url;
      console.log('✅ Image uploaded successfully:', imageUrl);
      
      return {
        success: true,
        url: imageUrl
      };
    } else {
      console.error('❌ ImgBB upload failed:', response.data);
      return {
        success: false,
        error: 'Upload failed. Please try again.'
      };
    }
  } catch (error: any) {
    console.error('❌ ImgBB upload error:', error);
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error?.message || 'Upload failed'
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    } else {
      return {
        success: false,
        error: 'Upload failed. Please try again.'
      };
    }
  }
}

/**
 * Fallback: Use existing product images from dropdown
 */
export const EXISTING_PRODUCT_IMAGES = [
  { value: '/Anti-Rust-Spray-500ml-Website-2.png', label: 'Anti Rust Spray' },
  { value: '/Battery-Terminal-Mask-front.png', label: 'Battery Terminal Mask' },
  { value: '/Brake-Parts-front-clean.png', label: 'Brake Parts Clean' },
  { value: '/Chain-Clean-front-1024x1024.png', label: 'Chain Clean' },
  { value: '/Chain-Lube-Spray-500ml-2-1024x1024.png', label: 'Chain Lube Spray' },
  { value: '/Electrical-Parts-Clean-front-1024x1024.png', label: 'Electrical Parts Clean' },
  { value: '/Engin-oil-flush.png', label: 'Engine Oil Flush' },
  { value: '/Engin-oil-treatment-1024x1024.png', label: 'Engine Oil Treatment' },
  { value: '/Multi-purpose-Micro-Fiber-Cloth.png', label: 'Microfiber Cloth' },
  { value: '/Silencer-Coat-matt-black-front-1024x1024.png', label: 'Silencer Coat Matt Black' },
  { value: '/Silencer-Coat-silver-front-1024x1024.png', label: 'Silencer Coat Silver' },
  { value: '/Spray-Paint-backside.png', label: 'Spray Paint' },
  { value: '/Throttle-and-Carburettor-Clean-500ml-Website-2.png', label: 'Throttle Carburettor Clean' },
  { value: '/car-wash-soap-1024x1024.png', label: 'Car Wash Soap' },
  { value: '/boult-raat-repelent.png', label: 'Rat Repellent' },
  { value: '/4W-Kit-1-1024x1024.png', label: '4W Kit' },
  { value: '/2W-Kit-1-1024x1024.png', label: '2W Kit' },
  { value: '/4W-Plastic-and-Fibre-Restorer.png', label: 'Plastic Restorer' },
  { value: '/windsheild-wash-1024x1024.png', label: 'Windshield Wash' },
  { value: '/vkhj.png', label: 'All in One Polish' },
  { value: '/bott-1024x1024.png', label: 'Radiator Coolant' },
  { value: '/spray-paint-front.png', label: 'Spray Paint Front' },
  { value: '/WhatsApp-Image-2025-08-14-at-12.34.25-AM-1-Photoroom.png', label: 'Engine Dresser' },
];
