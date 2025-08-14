import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  category: string;
}

interface SimpleProductSelectorProps {
  onProductsChange: (products: Array<{ product: Product; quantity: number; total: number }>) => void;
}

export const SimpleProductSelector: React.FC<SimpleProductSelectorProps> = ({ onProductsChange }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product: Product; quantity: number; total: number }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Mock products for demo
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Tesla Home Charger',
          description: 'High-speed 7kW home charging station',
          base_price: 850,
          category: 'Charger'
        },
        {
          id: '2',
          name: 'Universal EV Charger',
          description: 'Compatible with all electric vehicles',
          base_price: 750,
          category: 'Charger'
        },
        {
          id: '3',
          name: 'Smart Charging Cable',
          description: 'App-controlled charging cable',
          base_price: 125,
          category: 'Accessory'
        }
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const handleAddProduct = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const newProduct = {
      product,
      quantity,
      total: product.base_price * quantity
    };

    const updatedProducts = [...selectedProducts, newProduct];
    setSelectedProducts(updatedProducts);
    onProductsChange(updatedProducts);

    // Reset form
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updatedProducts);
    onProductsChange(updatedProducts);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Product</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.base_price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleAddProduct} disabled={!selectedProductId}>
            Add Product
          </Button>
        </CardContent>
      </Card>

      {selectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedProducts.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatCurrency(item.product.base_price)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveProduct(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};