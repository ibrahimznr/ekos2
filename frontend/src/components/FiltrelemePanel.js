import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FiltrelemePanel = ({ filters, onFilterChange }) => {
  const [kategoriler, setKategoriler] = useState([]);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    fetchKategoriler();
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const fetchKategoriler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/kategoriler`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKategoriler(response.data);
    } catch (error) {
      toast.error('Kategoriler yüklenemedi');
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { kategori: '', periyot: '', uygunluk: '' };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = localFilters.kategori || localFilters.periyot || localFilters.uygunluk;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700">Filtreler</Label>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="clear-filters-button"
          >
            <X className="h-4 w-4 mr-1" />
            Filtreleri Temizle
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Kategori Filter */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Kategori</Label>
          <Select
            value={localFilters.kategori}
            onValueChange={(value) => handleFilterChange('kategori', value)}
          >
            <SelectTrigger data-testid="filter-kategori-select">
              <SelectValue placeholder="Tüm kategoriler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm kategoriler</SelectItem>
              {kategoriler.map((kat) => (
                <SelectItem key={kat.id} value={kat.isim}>
                  {kat.isim}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Periyot Filter */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Periyot</Label>
          <Select
            value={localFilters.periyot}
            onValueChange={(value) => handleFilterChange('periyot', value)}
          >
            <SelectTrigger data-testid="filter-periyot-select">
              <SelectValue placeholder="Tüm periyotlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm periyotlar</SelectItem>
              <SelectItem value="3 Aylık">3 Aylık</SelectItem>
              <SelectItem value="6 Aylık">6 Aylık</SelectItem>
              <SelectItem value="12 Aylık">12 Aylık</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Uygunluk Filter */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Uygunluk</Label>
          <Select
            value={localFilters.uygunluk}
            onValueChange={(value) => handleFilterChange('uygunluk', value)}
          >
            <SelectTrigger data-testid="filter-uygunluk-select">
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tüm durumlar</SelectItem>
              <SelectItem value="Uygun">Uygun</SelectItem>
              <SelectItem value="Uygun Değil">Uygun Değil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FiltrelemePanel;