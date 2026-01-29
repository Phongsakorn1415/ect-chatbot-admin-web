"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface DrawerContextValue {
  isOpen: boolean;
  isClosing: boolean;
  toggle: () => void;
  close: () => void;
  handleTransitionEnd: () => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export const DrawerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const pathname = usePathname();

  const toggle = useCallback(() => {
    if (!isClosing) setIsOpen(prev => !prev);
  }, [isClosing]);

  const close = useCallback(() => {
    setIsClosing(true);
    setIsOpen(false);
  }, []);

  const handleTransitionEnd = useCallback(() => {
    setIsClosing(false);
  }, []);

  // If a route change happens while the drawer is closing, the Drawer component unmounts
  // before onTransitionEnd fires, leaving isClosing stuck as true. This prevents reopening.
  // Reset isClosing on every pathname change to guarantee the toggle works after navigation.
  useEffect(() => {
    if (isClosing) {
      setIsClosing(false);
    }
  }, [pathname, isClosing]);

  return (
    <DrawerContext.Provider value={{ isOpen, isClosing, toggle, close, handleTransitionEnd }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => useContext(DrawerContext);
