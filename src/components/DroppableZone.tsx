'use client';

import React, { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableZoneProps {
  id: string;
  type: 'folder' | 'root';
  children: ReactNode;
  className?: string;
  accepts?: Array<'folder' | 'testCase'>;
}

export function DroppableZone({
  id,
  type,
  children,
  className = '',
  accepts = ['folder', 'testCase'],
}: DroppableZoneProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id,
    data: {
      type,
      accepts,
    },
  });

  // Check if the dragged item is accepted by this drop zone
  const activeType = active?.data?.current?.type;
  const canDrop = activeType && accepts.includes(activeType);
  
  const isValidOver = isOver && canDrop;
  const isInvalidOver = isOver && !canDrop;

  return (
    <div
      ref={setNodeRef}
      className={`
        ${className}
        ${isValidOver ? 'bg-gray-50/50 dark:bg-slate-700/30 transition-colors duration-200' : ''}
        ${isInvalidOver ? 'bg-red-50/30 dark:bg-red-950/20 transition-colors duration-200' : ''}
        transition-colors duration-200 ease-out
      `}
    >
      {children}
    </div>
  );
}
