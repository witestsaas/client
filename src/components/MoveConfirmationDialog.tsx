'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Folder, FileText, MoveRight } from 'lucide-react';

interface MoveConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: 'folder' | 'testCase';
  targetName: string;
  isMoving?: boolean;
}

export function MoveConfirmationDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType,
  targetName,
  isMoving = false,
}: MoveConfirmationDialogProps) {
  const ItemIcon = itemType === 'folder' ? Folder : FileText;
  
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MoveRight className="w-5 h-5 text-[#FFAA00]" />
            Confirm Move Operation
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Are you sure you want to move this {itemType === 'folder' ? 'folder' : 'test case'}?
            </div>
            
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <ItemIcon className="w-4 h-4 text-[#FFAA00]" />
                <span className="font-medium text-foreground">
                  {itemName}
                </span>
              </div>
              
              <div className="flex items-center justify-center">
                <MoveRight className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-foreground">
                  {targetName || 'Root'}
                </span>
              </div>
            </div>

            {itemType === 'folder' && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                ⚠️ This will move the folder and all its contents (subfolders and test cases).
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isMoving}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isMoving}
            className="bg-[#FFAA00] hover:bg-[#F4A200] text-white"
          >
            {isMoving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Moving...
              </>
            ) : (
              'Confirm Move'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
