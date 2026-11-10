import React, { createContext, useContext, useState, useEffect } from 'react';

interface BcvContextType {
  bcvRate: number;
  isLoading: boolean;
  lastUpdated: string | null;
  refreshRate: () => Promise<void>;
  formatUsd: (amount: number) => string;
  formatVes: (amount: number) => string;
  usdToVes: (amountInUsd: number) => number;
  vesToUsd: (amountInVes: number) => number;
}

const DEFAULT_RATE = 36.50;

const BcvContext = createContext<BcvContextType>({
  bcvRate: DEFAULT_RATE,
  isLoading: false,
  lastUpdated: null,
  refreshRate: async () => {},
  formatUsd: (amt) => `$${amt.toFixed(2)}`,
  formatVes: (amt) => `Bs. ${amt.toFixed(2)}`,
  usdToVes: (amt) => amt * DEFAULT_RATE,
  vesToUsd: (amt) => amt / DEFAULT_RATE,
});

export const BcvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bcvRate, setBcvRate] = useState<number>(DEFAULT_RATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchBcvRate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error en API BCV: ${response.status}`);
      }

      const data = await response.json();
      // ve.dolarapi typically returns: { promedio: number, fechaActualizacion: string, ... }
      const rate = Number(data.promedio || data.precio || data.valor);

      if (rate && !isNaN(rate) && rate > 0) {
        setBcvRate(rate);
        if (data.fechaActualizacion) {
          const formattedDate = new Date(data.fechaActualizacion).toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastUpdated(formattedDate);
        }
      } else {
        setBcvRate(DEFAULT_RATE);
      }
    } catch {
      // Graceful fallback to default value 36.50 as requested
      setBcvRate(DEFAULT_RATE);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBcvRate();
  }, []);

  const formatUsd = (amount: number): string => {
    const safe = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : 0;
    return `$${safe.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatVes = (amount: number): string => {
    const safe = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : 0;
    return `Bs. ${safe.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const usdToVes = (amountInUsd: number): number => {
    const safe = typeof amountInUsd === 'number' && !isNaN(amountInUsd) && isFinite(amountInUsd) ? amountInUsd : 0;
    return safe * bcvRate;
  };

  const vesToUsd = (amountInVes: number): number => {
    const safe = typeof amountInVes === 'number' && !isNaN(amountInVes) && isFinite(amountInVes) ? amountInVes : 0;
    if (bcvRate <= 0) return 0;
    return safe / bcvRate;
  };

  return (
    <BcvContext.Provider
      value={{
        bcvRate,
        isLoading,
        lastUpdated,
        refreshRate: fetchBcvRate,
        formatUsd,
        formatVes,
        usdToVes,
        vesToUsd,
      }}
    >
      {children}
    </BcvContext.Provider>
  );
};

export const useBcv = () => useContext(BcvContext);
