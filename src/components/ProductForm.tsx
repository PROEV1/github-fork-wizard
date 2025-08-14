import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface Product {
  id?: string;
  name: string;
  description: string | null;
  base_price: number;
  category: string | null;
  is_active: boolean;
  specifications?: any;
  min_width?: number | null;
}

interface CoreProduct {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

const productCategories = [
  'EV Charger',
  'Installation Kit',
  'Accessories',
];

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [coreProducts, setCoreProducts] = useState<CoreProduct[]>([]);
  const [compatibleProducts, setCompatibleProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    base_price: product?.base_price || 0,
    category: product?.category || '',
    is_active: product?.is_active ?? true,
    specifications: product?.specifications || {},
    min_width: product?.min_width || '',
    max_width: product?.specifications?.max_width || '',
    charging_speed: product?.specifications?.charging_speed || '',
    sub_description: product?.specifications?.sub_description || ''
  });

  useEffect(() => {
    // Product catalog functionality disabled until EV product catalog is implemented
    console.log('Product form initialized - EV product catalog not yet implemented');
  }, [product?.id]);

  const fetchExistingImage = async () => {
    // Product images functionality disabled until EV product catalog is implemented
    console.log('Existing image fetching disabled - no EV product catalog yet');
  };

  const fetchCoreProducts = async () => {
    // EV product catalog functionality disabled until EV product catalog is implemented
    console.log('Core products fetching disabled - no EV product catalog yet');
    setCoreProducts([]);
  };

  const fetchCompatibleProducts = async () => {
    // EV product compatibility functionality disabled until EV product catalog is implemented
    console.log('Compatible products fetching disabled - no EV product catalog yet');
    setCompatibleProducts([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    // Image upload functionality disabled until EV product catalog is implemented
    console.log('Image upload disabled - no EV product catalog yet');
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.base_price < 0) {
      toast({
        title: "Error",
        description: "Base price must be non-negative",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Product creation/update functionality disabled until EV product catalog is implemented
      toast({
        title: "Info",
        description: "EV product catalog not yet implemented. This form is for demo purposes only.",
        variant: "default",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: `Failed to ${product?.id ? 'update' : 'create'} product`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">EV Charger Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter EV charger name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter EV charger description"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sub_description">Features</Label>
          <Input
            id="sub_description"
            value={formData.sub_description}
            onChange={(e) => setFormData({ ...formData, sub_description: e.target.value })}
            placeholder="Enter key features"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base_price">Base Price (£) *</Label>
            <Input
              id="base_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {productCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* EV Charger specific fields */}
        {formData.category === 'EV Charger' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="charging_speed">Charging Speed (kW)</Label>
              <Input
                id="charging_speed"
                type="number"
                min="0"
                step="0.1"
                value={formData.charging_speed}
                onChange={(e) => setFormData({ ...formData, charging_speed: e.target.value })}
                placeholder="Enter charging speed in kW"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_width">Installation Space (cm)</Label>
              <Input
                id="min_width"
                type="number"
                min="0"
                step="0.1"
                value={formData.min_width}
                onChange={(e) => setFormData({ ...formData, min_width: e.target.value })}
                placeholder="Required installation space"
              />
            </div>
          </div>
        )}

        {/* Image Upload Section - Disabled for now */}
        <div className="space-y-2">
          <Label>Product Image (Coming Soon)</Label>
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-6">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image (Coming Soon)
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Image upload will be available when the EV product catalog is implemented
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active Product</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploadingImage}>
          {loading ? 'Saving...' : (product?.id ? 'Update Product (Demo)' : 'Create Product (Demo)')}
        </Button>
      </div>
    </form>
  );
};