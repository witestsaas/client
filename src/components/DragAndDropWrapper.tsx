'use client';

import React, { ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core';
import { Folder, FileText } from 'lucide-react';

export interface DragItem {
  id: string;
  type: 'folder' | 'testCase';
  name: string;
  parentId?: string | null;
}

interface DragAndDropWrapperProps {
  children: ReactNode | ((isDragging: boolean, activeItem: DragItem | null) => ReactNode);
  onDragEnd: (event: {
    activeId: string;
    overId: string | null;
    activeType: 'folder' | 'testCase';
  }) => void;
  onDragStart?: (item: DragItem) => void;
  onDragCancel?: () => void;
  dragOverlay?: ReactNode;
}

export function DragAndDropWrapper({
  children,
  onDragEnd,
  onDragStart,
  onDragCancel,
  dragOverlay,
}: DragAndDropWrapperProps) {
  const [activeItem, setActiveItem] = React.useState<DragItem | null>(null);

  // Configure sensors for drag detection - immediate activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Small distance to prevent accidental drags while still feeling responsive
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current as DragItem;
    
    console.log('🎯 Drag started:', item);
    console.log('📍 Active element ID:', active.id);
    setActiveItem(item);
    
    // Add body class to show dragging cursor globally
    document.body.classList.add('dragging-cursor');
    
    if (onDragStart) {
      onDragStart(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('🏁 Drag ended:', { 
      activeId: active?.id, 
      overId: over?.id,
      activeData: active?.data?.current,
      overData: over?.data?.current
    });
    
    // Remove body class
    document.body.classList.remove('dragging-cursor');

    if (!active) {
      console.log('⚠️ No active item in drag end');
      setActiveItem(null);
      return;
    }

    const activeType = (active.data.current as DragItem)?.type;

    // Allow drops even when over is null (shouldn't happen with proper droppable zones)
    // or when dropping on a different item
    if (over && active.id !== over.id) {
      console.log('✅ Calling onDragEnd with:', {
        activeId: active.id,
        overId: over.id,
        activeType,
      });
      onDragEnd({
        activeId: active.id as string,
        overId: over.id as string,
        activeType,
      });
    } else {
      console.log('⚠️ Drag ended but no valid drop:', { 
        hasOver: !!over, 
        sameId: active.id === over?.id 
      });
    }

    setActiveItem(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
    if (onDragCancel) {
      onDragCancel();
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {typeof children === 'function' ? children(!!activeItem, activeItem) : children}
      <DragOverlay
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeItem ? (
          dragOverlay || (
            <div 
              className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg shadow-md cursor-grabbing"
              style={{
                zIndex: 9999,
                transition: 'all 150ms ease-out',
              }}
            >
              <div className="flex items-center gap-2">
                {activeItem.type === 'folder' ? (
                  <Folder className="w-4 h-4 text-gray-600 dark:text-gray-300 flex-shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-300 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {activeItem.name}
                </span>
              </div>
            </div>
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
