import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/utils/api';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  FileCode2,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  Grid3X3,
  Eye,
  EyeOff,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';

// Memoized entity renderer for performance
const EntityRenderer = memo(({ entity, viewBoxWidth }) => {
  const color = entity.color || '#FFFFFF';
  const strokeWidth = viewBoxWidth / 500;
  
  switch (entity.type) {
    case 'line':
      return (
        <line
          x1={entity.data.start.x}
          y1={-entity.data.start.y}
          x2={entity.data.end.x}
          y2={-entity.data.end.y}
          stroke={color}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      );
      
    case 'circle':
      return (
        <circle
          cx={entity.data.center.x}
          cy={-entity.data.center.y}
          r={entity.data.radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      );
      
    case 'arc': {
      const { center, radius, start_angle, end_angle } = entity.data;
      const startRad = (start_angle * Math.PI) / 180;
      const endRad = (end_angle * Math.PI) / 180;
      const startX = center.x + radius * Math.cos(startRad);
      const startY = -center.y - radius * Math.sin(startRad);
      const endX = center.x + radius * Math.cos(endRad);
      const endY = -center.y - radius * Math.sin(endRad);
      const largeArc = Math.abs(end_angle - start_angle) > 180 ? 1 : 0;
      
      return (
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 0 ${endX} ${endY}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      );
    }
      
    case 'polyline':
    case 'spline':
      if (!entity.data.points || entity.data.points.length < 2) return null;
      const points = entity.data.points.map(p => `${p.x},${-p.y}`).join(' ');
      return (
        <polyline
          points={points}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      );
      
    case 'text':
      return (
        <text
          x={entity.data.position.x}
          y={-entity.data.position.y}
          fill={color}
          fontSize={entity.data.height || viewBoxWidth / 50}
          fontFamily="monospace"
        >
          {entity.data.text}
        </text>
      );
      
    default:
      return null;
  }
});

EntityRenderer.displayName = 'EntityRenderer';

// Chunked entity list for large datasets
const ChunkedEntityList = memo(({ entities, viewBoxWidth, visibleLayers, chunkSize = 2000 }) => {
  const [renderedChunks, setRenderedChunks] = useState(1);
  const totalChunks = Math.ceil(entities.length / chunkSize);
  
  useEffect(() => {
    if (renderedChunks < totalChunks) {
      const frame = requestAnimationFrame(() => {
        setRenderedChunks(prev => Math.min(prev + 1, totalChunks));
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [renderedChunks, totalChunks]);
  
  const visibleEntities = useMemo(() => {
    return entities
      .slice(0, renderedChunks * chunkSize)
      .filter(e => visibleLayers[e.layer] !== false);
  }, [entities, renderedChunks, chunkSize, visibleLayers]);
  
  return (
    <>
      {visibleEntities.map((entity, index) => (
        <EntityRenderer
          key={index}
          entity={entity}
          viewBoxWidth={viewBoxWidth}
        />
      ))}
    </>
  );
});

ChunkedEntityList.displayName = 'ChunkedEntityList';

const CADViewer = ({ 
  onFileSelect = null, 
  projectId = null, 
  reportId = null,
  showUpload = true,
  initialFileId = null,
  className = ''
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [entities, setEntities] = useState([]);
  const [bounds, setBounds] = useState({ min_x: 0, min_y: 0, max_x: 100, max_y: 100 });
  const [layers, setLayers] = useState([]);
  const [visibleLayers, setVisibleLayers] = useState({});
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [entityCount, setEntityCount] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isAsyncProcessing, setIsAsyncProcessing] = useState(false);
  const [asyncTaskId, setAsyncTaskId] = useState(null);
  
  // View state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  
  // File list state
  const [savedFiles, setSavedFiles] = useState([]);
  const [showFileList, setShowFileList] = useState(false);
  
  // Initialize viewBox when bounds change
  useEffect(() => {
    if (bounds) {
      const width = bounds.max_x - bounds.min_x;
      const height = bounds.max_y - bounds.min_y;
      setViewBox({
        x: bounds.min_x,
        y: bounds.min_y,
        width: width || 100,
        height: height || 100
      });
    }
  }, [bounds]);
  
  // Initialize visible layers
  useEffect(() => {
    const initial = {};
    layers.forEach(layer => {
      initial[layer] = true;
    });
    setVisibleLayers(initial);
  }, [layers]);

  // Load initial file
  useEffect(() => {
    if (initialFileId) {
      loadSavedFile(initialFileId);
    }
  }, [initialFileId]);

  // Poll async task status
  useEffect(() => {
    if (!asyncTaskId || !isAsyncProcessing) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/cad/parse-status/${asyncTaskId}`);
        setProcessingProgress(response.data.progress);
        
        if (response.data.status === 'completed') {
          // Fetch result
          const resultResponse = await api.get(`/cad/parse-result/${asyncTaskId}`);
          setEntities(resultResponse.data.entities);
          setBounds(resultResponse.data.bounds);
          setLayers(resultResponse.data.layers);
          setEntityCount(resultResponse.data.entity_count);
          setIsAsyncProcessing(false);
          setLoading(false);
          toast.success(resultResponse.data.message);
          clearInterval(pollInterval);
        } else if (response.data.status === 'error') {
          setIsAsyncProcessing(false);
          setLoading(false);
          toast.error(response.data.message);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 1000);
    
    return () => clearInterval(pollInterval);
  }, [asyncTaskId, isAsyncProcessing]);
  
  // Handle file upload with size-based routing
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.dxf')) {
      toast.error('Sadece DXF dosyaları desteklenmektedir');
      return;
    }
    
    setLoading(true);
    setFileName(file.name);
    setProcessingProgress(0);
    
    const fileSizeMB = file.size / (1024 * 1024);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use async processing for large files (> 5MB)
      if (fileSizeMB > 5) {
        setIsAsyncProcessing(true);
        const response = await api.post('/cad/parse-async', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAsyncTaskId(response.data.task_id);
        toast.info('Büyük dosya işleniyor, lütfen bekleyin...');
      } else {
        // Direct processing for smaller files
        const response = await api.post('/cad/parse', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success) {
          setEntities(response.data.entities);
          setBounds(response.data.bounds);
          setLayers(response.data.layers);
          setEntityCount(response.data.entity_count);
          setZoom(1);
          toast.success(response.data.message);
          
          if (onFileSelect) {
            onFileSelect(file, response.data);
          }
        }
        setLoading(false);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Dosya yüklenirken hata oluştu';
      toast.error(message);
      setLoading(false);
      setIsAsyncProcessing(false);
    }
  };
  
  // Load saved file
  const loadSavedFile = async (fileId) => {
    setLoading(true);
    
    try {
      const response = await api.get(`/cad/file/${fileId}`);
      setEntities(response.data.entities);
      setBounds(response.data.bounds);
      setLayers(response.data.layers);
      setFileName(response.data.metadata.filename);
      setEntityCount(response.data.entities.length);
      setZoom(1);
      setShowFileList(false);
      toast.success('CAD dosyası yüklendi');
    } catch (error) {
      toast.error('Dosya yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Load file list
  const loadFileList = async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      if (reportId) params.append('report_id', reportId);
      
      const response = await api.get(`/cad/files?${params.toString()}`);
      setSavedFiles(response.data);
    } catch (error) {
      console.error('File list error:', error);
    }
  };
  
  // Delete file
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Bu CAD dosyasını silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/cad/file/${fileId}`);
      toast.success('Dosya silindi');
      loadFileList();
    } catch (error) {
      toast.error('Dosya silinirken hata oluştu');
    }
  };
  
  // Zoom controls - using requestAnimationFrame for smooth updates
  const handleZoomIn = useCallback(() => {
    requestAnimationFrame(() => {
      setZoom(prev => Math.min(prev * 1.5, 10));
      setViewBox(prev => ({
        ...prev,
        width: prev.width / 1.5,
        height: prev.height / 1.5,
        x: prev.x + prev.width * 0.25 / 1.5,
        y: prev.y + prev.height * 0.25 / 1.5
      }));
    });
  }, []);
  
  const handleZoomOut = useCallback(() => {
    requestAnimationFrame(() => {
      setZoom(prev => Math.max(prev / 1.5, 0.1));
      setViewBox(prev => ({
        ...prev,
        width: prev.width * 1.5,
        height: prev.height * 1.5,
        x: prev.x - prev.width * 0.25,
        y: prev.y - prev.height * 0.25
      }));
    });
  }, []);
  
  const handleReset = useCallback(() => {
    if (bounds) {
      const width = bounds.max_x - bounds.min_x;
      const height = bounds.max_y - bounds.min_y;
      setViewBox({
        x: bounds.min_x,
        y: bounds.min_y,
        width: width || 100,
        height: height || 100
      });
      setZoom(1);
    }
  }, [bounds]);
  
  // Pan handlers with requestAnimationFrame
  const handleMouseDown = useCallback((e) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (!isPanning || !svgRef.current) return;
    
    requestAnimationFrame(() => {
      const svg = svgRef.current;
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const dx = (e.clientX - panStart.x) * (viewBox.width / rect.width);
      const dy = (e.clientY - panStart.y) * (viewBox.height / rect.height);
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y + dy
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    });
  }, [isPanning, panStart, viewBox]);
  
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  // Wheel zoom with requestAnimationFrame
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    requestAnimationFrame(() => {
      const delta = e.deltaY > 0 ? 1.1 : 0.9;
      const svg = svgRef.current;
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;
      
      setViewBox(prev => {
        const newWidth = prev.width * delta;
        const newHeight = prev.height * delta;
        
        return {
          x: prev.x + (prev.width - newWidth) * mouseX,
          y: prev.y + (prev.height - newHeight) * (1 - mouseY),
          width: newWidth,
          height: newHeight
        };
      });
      
      setZoom(prev => prev / delta);
    });
  }, []);
  
  // Toggle layer visibility
  const toggleLayer = useCallback((layer) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);
  
  // Memoized grid renderer
  const gridLines = useMemo(() => {
    if (!showGrid) return null;
    
    const gridSize = Math.pow(10, Math.floor(Math.log10(viewBox.width / 10)));
    const lines = [];
    
    const startX = Math.floor(viewBox.x / gridSize) * gridSize;
    const endX = viewBox.x + viewBox.width;
    
    for (let x = startX; x <= endX; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={-viewBox.y}
          x2={x}
          y2={-(viewBox.y - viewBox.height)}
          stroke="#333333"
          strokeWidth={viewBox.width / 2000}
        />
      );
    }
    
    const startY = Math.floor(-viewBox.y / gridSize) * gridSize;
    const endY = -(viewBox.y - viewBox.height);
    
    for (let y = startY; y <= endY; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={viewBox.x}
          y1={-y}
          x2={viewBox.x + viewBox.width}
          y2={-y}
          stroke="#333333"
          strokeWidth={viewBox.width / 2000}
        />
      );
    }
    
    return <g className="grid">{lines}</g>;
  }, [showGrid, viewBox]);

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileCode2 className="h-5 w-5 text-cyan-400" />
            CAD Görüntüleyici
            {fileName && (
              <Badge variant="secondary" className="ml-2 bg-slate-700 text-cyan-300">
                {fileName}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {entityCount > 0 && (
              <Badge variant="outline" className="text-slate-300 border-slate-600">
                {entityCount.toLocaleString('tr-TR')} öğe
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-800 border-b border-slate-700">
          {showUpload && (
            <>
              <Label htmlFor="cad-file-input" className="cursor-pointer">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    DXF Yükle
                  </span>
                </Button>
              </Label>
              <Input
                id="cad-file-input"
                type="file"
                accept=".dxf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}
          
          <div className="h-6 w-px bg-slate-600 mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={entities.length === 0}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={entities.length === 0}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={entities.length === 0}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-px bg-slate-600 mx-1" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className={`bg-slate-700 border-slate-600 hover:bg-slate-600 ${showGrid ? 'text-cyan-400' : 'text-slate-400'}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            disabled={layers.length === 0}
            className={`bg-slate-700 border-slate-600 hover:bg-slate-600 ${showLayerPanel ? 'text-cyan-400' : 'text-slate-200'}`}
          >
            <Layers className="h-4 w-4 mr-1" />
            Katmanlar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadFileList();
              setShowFileList(true);
            }}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
          >
            <Download className="h-4 w-4 mr-1" />
            Kayıtlı Dosyalar
          </Button>
          
          <div className="flex-1" />
          
          <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
            Zoom: {(zoom * 100).toFixed(0)}%
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Layer Panel */}
        {showLayerPanel && layers.length > 0 && (
          <div className="p-3 bg-slate-800 border-b border-slate-700">
            <p className="text-sm text-slate-400 mb-2">Katmanlar ({layers.length})</p>
            <div className="flex flex-wrap gap-2">
              {layers.map(layer => (
                <Button
                  key={layer}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLayer(layer)}
                  className={`text-xs ${
                    visibleLayers[layer]
                      ? 'bg-cyan-900/50 border-cyan-600 text-cyan-300'
                      : 'bg-slate-700 border-slate-600 text-slate-400'
                  }`}
                >
                  {visibleLayers[layer] ? (
                    <Eye className="h-3 w-3 mr-1" />
                  ) : (
                    <EyeOff className="h-3 w-3 mr-1" />
                  )}
                  {layer}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Processing Progress */}
        {isAsyncProcessing && (
          <div className="p-4 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              <span className="text-slate-300">Büyük dosya işleniyor...</span>
              <span className="text-cyan-400 font-medium">{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </div>
        )}
        
        {/* Canvas Area */}
        <div
          ref={containerRef}
          className={`relative bg-slate-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
          style={{ height: isFullscreen ? '100vh' : '500px' }}
        >
          {loading && !isAsyncProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                <p className="text-slate-400">Dosya işleniyor...</p>
              </div>
            </div>
          )}
          
          {entities.length === 0 && !loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <FileCode2 className="h-16 w-16 mb-4 text-slate-600" />
              <p className="text-lg font-medium">CAD dosyası yüklenmedi</p>
              <p className="text-sm mt-1">DXF dosyası yükleyin veya kayıtlı dosyalardan seçin</p>
              <div className="mt-4 p-4 bg-slate-800 rounded-lg text-sm">
                <p className="text-cyan-400 font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Desteklenen Formatlar
                </p>
                <ul className="text-slate-400 space-y-1">
                  <li>• ASCII DXF (tüm versiyonlar)</li>
                  <li>• Binary DXF (R12-2024)</li>
                  <li>• Kurtarma modu (bozuk dosyalar)</li>
                </ul>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`${viewBox.x} ${-(viewBox.y + viewBox.height)} ${viewBox.width} ${viewBox.height}`}
              preserveAspectRatio="xMidYMid meet"
              className="cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{ backgroundColor: '#0f172a' }}
            >
              {gridLines}
              <g className="entities">
                <ChunkedEntityList
                  entities={entities}
                  viewBoxWidth={viewBox.width}
                  visibleLayers={visibleLayers}
                  chunkSize={2000}
                />
              </g>
            </svg>
          )}
          
          {isFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-slate-800 border-slate-600 text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Kapat
            </Button>
          )}
        </div>
        
        {/* Info Bar */}
        {entities.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800 text-xs text-slate-400 border-t border-slate-700">
            <span>ViewBox: X={viewBox.x.toFixed(2)}, Y={viewBox.y.toFixed(2)}</span>
            <span>Boyut: {viewBox.width.toFixed(2)} x {viewBox.height.toFixed(2)}</span>
          </div>
        )}
      </CardContent>
      
      {/* File List Dialog */}
      <Dialog open={showFileList} onOpenChange={setShowFileList}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-cyan-400" />
              Kayıtlı CAD Dosyaları
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Daha önce yüklenen CAD dosyalarını görüntüleyin
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {savedFiles.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileCode2 className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                <p>Henüz kayıtlı CAD dosyası yok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode2 className="h-8 w-8 text-cyan-400" />
                      <div>
                        <p className="font-medium text-slate-200">{file.filename}</p>
                        <p className="text-xs text-slate-400">
                          {file.entity_count?.toLocaleString('tr-TR')} öğe • {new Date(file.upload_date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => loadSavedFile(file.id)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        Aç
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFileList(false)} className="border-slate-600">
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CADViewer;
