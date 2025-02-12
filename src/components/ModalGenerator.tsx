import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';

export interface IModalGenerator {
  title?: string;
  submitButtonText?: string;
  hideHeader?: boolean;
  description?: string;
  hideCancelButton?: boolean;
  isCancelButtonLoading?: boolean;
  height?: string;
  disableSubmitButton?: boolean;
  cancelButtonText?: string;
  onClose: () => void;
  onSubmit?: () => void;
  isOpen: boolean;
  modalContent?: JSX.Element;
  isSubmitLoading?: boolean;
  confirmationIcon?: JSX.Element;
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hideSubmitButton?: boolean;
  handleCancel?: () => void;
  CustomHeader?: FC;
  extraActionButtons?: JSX.Element[];
  fullScreen?: boolean;
  showActionBar?: boolean;
}

const ModalGenerator: FC<IModalGenerator> = ({
  isOpen,
  onClose,
  title,
  description,
  modalContent,
  onSubmit,
  hideSubmitButton,
  hideCancelButton,
  showActionBar,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[768px] max-w-fit">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div
          style={{
            width: '100%',
            height: '2px',
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
          }}
        />
        {modalContent}
        {showActionBar && (
          <>
            <div
              style={{
                width: '100%',
                height: '2px',
                backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
              }}
            />
            <DialogFooter>
              {!hideCancelButton && <Button onClick={onClose}>Cancel</Button>}
              {!hideSubmitButton && <Button onClick={onSubmit}>Submit</Button>}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalGenerator;
