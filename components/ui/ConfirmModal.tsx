import React,{ useEffect,useState } from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = false
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return;
    }, [isOpen]);

    if (!mounted) return null;
    return <Modal isOpen={isOpen} onClose={onCancel} label={title}>
        <div className="web-confirm-panel"><h2>{title}</h2><p>{message}</p><div><button className="web-secondary" onClick={onCancel}>{cancelLabel}</button><button className="web-primary" onClick={onConfirm}>{confirmLabel}</button></div></div>
    </Modal>;
};
