'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { BillData } from './types';

interface BillContextType {
  billData: BillData;
  setBillData: (data: BillData) => void;
  updateBillData: (partial: Partial<BillData>) => void;
  clearBillData: () => void;
}

const initialBillData: BillData = {
  file: null,
  fileUrl: null,
  extracted: null,
  analysis: null,
  userContext: null,
  classification: null,
};

const BillContext = createContext<BillContextType>({
  billData: initialBillData,
  setBillData: () => {},
  updateBillData: () => {},
  clearBillData: () => {},
});

export function BillProvider({ children }: { children: ReactNode }) {
  const [billData, setBillDataState] = useState<BillData>(initialBillData);

  const setBillData = (data: BillData) => {
    setBillDataState(data);
  };

  const updateBillData = (partial: Partial<BillData>) => {
    setBillDataState((prev) => ({ ...prev, ...partial }));
  };

  const clearBillData = () => {
    // Clean up object URLs to prevent memory leaks
    if (billData.fileUrl) {
      URL.revokeObjectURL(billData.fileUrl);
    }
    setBillDataState(initialBillData);
  };

  return (
    <BillContext.Provider value={{ billData, setBillData, updateBillData, clearBillData }}>
      {children}
    </BillContext.Provider>
  );
}

export function useBillData() {
  const context = useContext(BillContext);
  if (!context) {
    throw new Error('useBillData must be used within a BillProvider');
  }
  return context;
}
