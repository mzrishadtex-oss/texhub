import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Clock, User, Settings, BarChart3, AlertTriangle, Beaker, Calendar, Timer } from 'lucide-react';
import { ProductionEntry } from '../types/production';

interface ProductionDataEntryProps {
  productionType: 'knitting' | 'dyeing' | 'finishing';
  onSave: (data: Omit<ProductionEntry, 'id' | 'userId' | 'timestamp'>) => void;
  editingEntry?: ProductionEntry | null;
  onCancel: () => void;
}

export const ProductionDataEntry: React.FC<ProductionDataEntryProps> = ({
  productionType,
  onSave,
  editingEntry,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<ProductionEntry>>({
    date: new Date().toISOString().split('T')[0],
    shift: 'morning',
    type: productionType,
    targetProduction: 0,
    actualProduction: 0,
    efficiency: 0,
    qualityGrade: 'A',
    defectCount: 0,
    machineDowntime: 0,
    startDateTime: '',
    endDateTime: '',
    totalHours: '0 Hrs 0 Min',
    operator: '',
    supervisor: '',
    machineNo: '',
    notes: ''
  });

  useEffect(() => {
    if (editingEntry) {
      setFormData(editingEntry);
    }
  }, [editingEntry]);

  // Function to calculate total hours in "X Hrs Y Min" format
  const calculateTotalHours = (startDateTime: string, endDateTime: string): string => {
    if (!startDateTime || !endDateTime) return '0 Hrs 0 Min';
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    if (end <= start) return '0 Hrs 0 Min';
    
    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours} Hrs ${minutes} Min`;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate total hours when start or end time changes
      if (field === 'startDateTime' || field === 'endDateTime') {
        const startDateTime = field === 'startDateTime' ? value : updated.startDateTime || '';
        const endDateTime = field === 'endDateTime' ? value : updated.endDateTime || '';
        updated.totalHours = calculateTotalHours(startDateTime, endDateTime);
      }
      
      // Auto-calculate efficiency for knitting and garments
      if (field === 'actualProduction' || field === 'targetProduction') {
        const actual = field === 'actualProduction' ? value : updated.actualProduction || 0;
        const target = field === 'targetProduction' ? value : updated.targetProduction || 0;
        updated.efficiency = target > 0 ? Math.round((actual / target) * 100) : 0;
      }
      
      // Auto-calculate efficiency for garments (completedQuantity vs targetQuantity)
      if (field === 'completedQuantity' || field === 'targetQuantity') {
        const completed = field === 'completedQuantity' ? value : updated.completedQuantity || 0;
        const target = field === 'targetQuantity' ? value : updated.targetQuantity || 0;
        updated.efficiency = target > 0 ? Math.round((completed / target) * 100) : 0;
      }
      
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.operator || !formData.supervisor || !formData.machineNo || !formData.startDateTime || !formData.endDateTime) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Create the entry based on production type
    let entryData: any = {
      type: productionType,
      date: formData.date,
      shift: formData.shift,
      operator: formData.operator,
      supervisor: formData.supervisor,
      machineNo: formData.machineNo,
      startDateTime: formData.startDateTime,
      endDateTime: formData.endDateTime,
      totalHours: formData.totalHours,
      notes: formData.notes || '',
    };

    // Add type-specific fields
    if (productionType === 'knitting') {
      entryData = {
        ...entryData,
        fabricType: formData.fabricType || '',
        yarnType: formData.yarnType || '',
        yarnLot: formData.yarnLot || '',
        gauge: formData.gauge || '',
        gsm: formData.gsm || 0,
        width: formData.width || 0,
        targetProduction: formData.targetProduction || 0,
        actualProduction: formData.actualProduction || 0,
        efficiency: formData.efficiency || 0,
        defects: formData.defects || {
          holes: 0,
          dropStitches: 0,
          yarnBreaks: 0,
          other: 0,
        },
        qualityGrade: formData.qualityGrade || 'A',
        rpm: formData.rpm || 0,
        needleBreaks: formData.needleBreaks || 0,
      };
    } else if (productionType === 'dyeing') {
      entryData = {
        ...entryData,
        fabricType: formData.fabricType || '',
        color: formData.color || '',
        dyeType: formData.dyeType || '',
        batchWeight: formData.batchWeight || 0,
        liquorRatio: formData.liquorRatio || 0,
        temperature: formData.temperature || 0,
        pH: formData.phLevel || 0,
        processTime: formData.processTime || 0,
        chemicalConsumption: formData.chemicalConsumption || {
          dyes: 0,
          salt: 0,
          soda: 0,
          auxiliaries: 0,
        },
        qualityResults: formData.qualityResults || {
          colorMatch: 'excellent',
          fastness: 'excellent',
          uniformity: 'excellent',
        },
        waterConsumption: formData.waterConsumption || 0,
        energyConsumption: formData.energyConsumption || 0,
        wasteGenerated: formData.wasteGenerated || 0,
      };
    } else if (productionType === 'finishing') {
      entryData = {
        ...entryData,
        style: formData.style || '',
        size: formData.size || '',
        color: formData.color || '',
        targetQuantity: formData.targetQuantity || 0,
        completedQuantity: formData.completedQuantity || 0,
        efficiency: formData.efficiency || 0,
        defects: formData.defects || {
          stitchingDefects: 0,
          measurementDefects: 0,
          fabricDefects: 0,
          other: 0,
        },
        operations: formData.operations || {
          cutting: 0,
          sewing: 0,
          finishing: 0,
          packing: 0,
        },
        qualityGrade: formData.qualityGrade || 'A',
        rework: formData.rework || 0,
      };
    }

    onSave(entryData);
    
    // Reset form after successful save
    setFormData({
      date: new Date().toISOString().split('T')[0],
      shift: 'morning',
      type: productionType,
      targetProduction: 0,
      actualProduction: 0,
      efficiency: 0,
      qualityGrade: 'A',
      defectCount: 0,
      machineDowntime: 0,
      startDateTime: '',
      endDateTime: '',
      totalHours: '0 Hrs 0 Min',
      operator: '',
      supervisor: '',
      machineNo: '',
      notes: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-card rounded-lg shadow-lg border border-border">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Information Section */}
        <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Date</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/20 bg-background text-foreground transition-all duration-300 hover:border-primary/50 hover:shadow-md font-medium text-sm"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Shift</label>
              <select
                value={formData.shift || 'morning'}
                onChange={(e) => handleInputChange('shift', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Operator *</label>
              <input
                type="text"
                value={formData.operator || ''}
                onChange={(e) => handleInputChange('operator', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Operator name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Supervisor *</label>
              <input
                type="text"
                value={formData.supervisor || ''}
                onChange={(e) => handleInputChange('supervisor', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Supervisor name"
                required
              />
            </div>
          </div>
        </div>

        {/* Machine & Timing Section */}
        <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/20">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-secondary mr-2" />
            <h3 className="text-lg font-semibold text-foreground">Machine & Timing</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Machine No *</label>
              <input
                type="text"
                value={formData.machineNo || ''}
                onChange={(e) => handleInputChange('machineNo', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary bg-background text-foreground"
                placeholder="Machine number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Start Date & Time *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
                <input
                  type="datetime-local"
                  value={formData.startDateTime || ''}
                  onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border shadow-sm focus:border-secondary focus:ring-4 focus:ring-secondary/20 bg-background text-foreground transition-all duration-300 hover:border-secondary/50 hover:shadow-md font-medium text-sm"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">End Date & Time *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <Timer className="h-5 w-5 text-accent" />
                </div>
                <input
                  type="datetime-local"
                  value={formData.endDateTime || ''}
                  onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/20 bg-background text-foreground transition-all duration-300 hover:border-accent/50 hover:shadow-md font-medium text-sm"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Total Hours</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.totalHours || '0 Hrs 0 Min'}
                  readOnly
                  className="w-full px-3 py-2 border border-border rounded-md bg-muted/50 text-foreground font-mono text-center"
                  placeholder="Auto-calculated"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Production Details Section */}
        <div className="bg-accent/10 p-6 rounded-lg border border-accent/20">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-accent mr-2" />
            <h3 className="text-lg font-semibold text-foreground">Production Details</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {productionType === 'knitting' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fabric Type</label>
                  <input
                    type="text"
                    value={formData.fabricType || ''}
                    onChange={(e) => handleInputChange('fabricType', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="Fabric type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Yarn Type</label>
                  <input
                    type="text"
                    value={formData.yarnType || ''}
                    onChange={(e) => handleInputChange('yarnType', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="Yarn type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Target Production (kg)</label>
                  <input
                    type="number"
                    value={formData.targetProduction || ''}
                    onChange={(e) => handleInputChange('targetProduction', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Actual Production (kg)</label>
                  <input
                    type="number"
                    value={formData.actualProduction || ''}
                    onChange={(e) => handleInputChange('actualProduction', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">GSM</label>
                  <input
                    type="number"
                    value={formData.gsm || ''}
                    onChange={(e) => handleInputChange('gsm', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={formData.width || ''}
                    onChange={(e) => handleInputChange('width', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Efficiency (%)</label>
                  <input
                    type="number"
                    value={formData.efficiency || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-border rounded-md bg-muted/50 text-foreground font-mono text-center"
                    placeholder="Auto-calculated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Quality Grade</label>
                  <select
                    value={formData.qualityGrade || 'A'}
                    onChange={(e) => handleInputChange('qualityGrade', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
              </>
            )}
            
            {productionType === 'dyeing' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Fabric Type</label>
                  <input
                    type="text"
                    value={formData.fabricType || ''}
                    onChange={(e) => handleInputChange('fabricType', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="Fabric type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="Color name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Batch Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.batchWeight || ''}
                    onChange={(e) => handleInputChange('batchWeight', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    value={formData.temperature || ''}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">pH Level</label>
                  <input
                    type="number"
                    value={formData.phLevel || ''}
                    onChange={(e) => handleInputChange('phLevel', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    max="14"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Liquor Ratio</label>
                  <input
                    type="number"
                    value={formData.liquorRatio || ''}
                    onChange={(e) => handleInputChange('liquorRatio', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="1:10"
                    step="0.1"
                    min="0"
                  />
                </div>
              </>
            )}
            
            {productionType === 'finishing' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Style</label>
                  <input
                    type="text"
                    value={formData.style || ''}
                    onChange={(e) => handleInputChange('style', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="Garment style"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="Color"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Target Quantity</label>
                  <input
                    type="number"
                    value={formData.targetQuantity || ''}
                    onChange={(e) => handleInputChange('targetQuantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Completed Quantity</label>
                  <input
                    type="number"
                    value={formData.completedQuantity || ''}
                    onChange={(e) => handleInputChange('completedQuantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Efficiency (%)</label>
                  <input
                    type="number"
                    value={formData.efficiency || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-border rounded-md bg-muted/50 text-foreground font-mono text-center"
                    placeholder="Auto-calculated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Quality Grade</label>
                  <select
                    value={formData.qualityGrade || 'A'}
                    onChange={(e) => handleInputChange('qualityGrade', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-background text-foreground"
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chemical Consumption Section (Dyeing Only) */}
        {productionType === 'dyeing' && (
          <div className="bg-primary/5 p-6 rounded-lg border border-primary/30">
            <div className="flex items-center mb-4">
              <Beaker className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-foreground">Chemical Consumption</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Dyes (kg)</label>
                <input
                  type="number"
                  value={formData.dyesUsed || ''}
                  onChange={(e) => handleInputChange('dyesUsed', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Salt (kg)</label>
                <input
                  type="number"
                  value={formData.saltUsed || ''}
                  onChange={(e) => handleInputChange('saltUsed', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Soda (kg)</label>
                <input
                  type="number"
                  value={formData.sodaUsed || ''}
                  onChange={(e) => handleInputChange('sodaUsed', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Auxiliaries (kg)</label>
                <input
                  type="number"
                  value={formData.auxiliariesUsed || ''}
                  onChange={(e) => handleInputChange('auxiliariesUsed', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="0.0"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes Section */}
        <div className="bg-muted/30 p-6 rounded-lg border border-border">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-muted-foreground mr-2" />
            <h3 className="text-lg font-semibold text-foreground">Additional Notes</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Production Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-muted-foreground bg-background text-foreground"
                placeholder="Additional notes about production..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-border">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {editingEntry ? 'Update Entry' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
};