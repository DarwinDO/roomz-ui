import React, { useState, useCallback } from 'react';
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

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface UseConfirmReturn {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    ConfirmDialog: () => React.ReactNode;
}

export function useConfirm(): UseConfirmReturn {
    const [state, setState] = useState<{
        open: boolean;
        options: ConfirmOptions;
        resolve: ((value: boolean) => void) | null;
    }>({
        open: false,
        options: { title: '', description: '' },
        resolve: null,
    });

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({ open: true, options, resolve });
        });
    }, []);

    const handleClose = useCallback((result: boolean) => {
        state.resolve?.(result);
        setState((prev) => ({ ...prev, open: false, resolve: null }));
    }, [state.resolve]);

    const ConfirmDialog = useCallback(() => {
        if (!state.open) return null;

        const { title, description, confirmText = 'Xác nhận', cancelText = 'Hủy', variant = 'default' } = state.options;

        return (
            <AlertDialog open={state.open} onOpenChange={(open) => !open && handleClose(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => handleClose(false)}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    handleClose(false);
                                }
                            }}
                        >
                            {cancelText}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleClose(true)}
                            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }, [state.open, state.options, handleClose]);

    return { confirm, ConfirmDialog };
}
