import React from 'react';
import './DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
  show: boolean;
  title?: string;
  message: string;
  hint?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  title = '⚠️ 确认删除',
  message,
  hint,
  confirmText = '确认删除',
  cancelText = '取消',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={e => e.stopPropagation()}>
        <div className="delete-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="delete-modal-body">
          <p className="delete-warning">{message}</p>
          {hint && <p className="delete-hint">{hint}</p>}
        </div>
        <div className="delete-modal-footer">
          <button 
            className="delete-modal-btn delete-modal-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className="delete-modal-btn delete-modal-btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '删除中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
