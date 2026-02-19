'use client';

import React, { ReactNode, CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { DragItem } from './DragAndDropWrapper';

interface DraggableItemProps {
  id: string;
  type: 'folder' | 'testCase';
  name: string;
  parentId?: string | null;
  children: (props: { 
    dragHandleProps: any; 
    isDragging: boolean;
    ref: (node: HTMLElement | null) => void;
  }) => ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DraggableItem({
  id,
  type,
  name,
  parentId,
  children,
  className = '',
  disabled = false,
}: DraggableItemProps) {
  const dragData: DragItem = {
    id,
    type,
    name,
    parentId,
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: dragData,
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: isDragging ? 1000 : 'auto',
  };

  // Log when component is mounted
  React.useEffect(() => {
    console.log('✅ DraggableItem mounted:', { id, type, name });
  }, [id, type, name]);

  return (
    <div
      style={style}
      className={`drag-item ${className} ${isDragging ? 'shadow-lg bg-white/80 dark:bg-slate-800/80' : ''}`}
    >
      {children({
        dragHandleProps: { ...listeners, ...attributes },
        isDragging,
        ref: setNodeRef,
      })}
    </div>
  );
}
