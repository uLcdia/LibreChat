import React, { useCallback, useState } from 'react';
import { QueryKeys } from 'librechat-data-provider';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import type { TMessage } from 'librechat-data-provider';
import { useDeleteConversationMutation } from '~/data-provider';
import {
  OGDialog,
  OGDialogTrigger,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import { TrashIcon } from '~/components/svg';
import { useLocalize, useNewConvo } from '~/hooks';

type DeleteButtonProps = {
  conversationId: string;
  retainView: () => void;
  title: string;
  className?: string;
  showDeleteDialog?: boolean;
  setShowDeleteDialog?: (value: boolean) => void;
};

export default function DeleteButton({
  conversationId,
  retainView,
  title,
  className = '',
  showDeleteDialog,
  setShowDeleteDialog,
}: DeleteButtonProps) {
  const localize = useLocalize();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { newConversation } = useNewConvo();
  const { conversationId: currentConvoId } = useParams();
  const [open, setOpen] = useState(false);
  const deleteConvoMutation = useDeleteConversationMutation({
    onSuccess: () => {
      if (currentConvoId === conversationId || currentConvoId === 'new') {
        newConversation();
        navigate('/c/new', { replace: true });
      }
      retainView();
    },
  });

  const confirmDelete = useCallback(() => {
    const messages = queryClient.getQueryData<TMessage[]>([QueryKeys.messages, conversationId]);
    const thread_id = messages?.[messages.length - 1]?.thread_id;

    deleteConvoMutation.mutate({ conversationId, thread_id, source: 'button' });
  }, [conversationId, deleteConvoMutation, queryClient]);

  const dialogContent = (
    <OGDialogTemplate
      showCloseButton={false}
      title={localize('com_ui_delete_conversation')}
      className="max-w-[450px]"
      main={
        <>
          <div className="flex w-full flex-col items-center gap-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="dialog-confirm-delete" className="text-left text-sm font-medium">
                {localize('com_ui_delete_confirm')} <strong>{title}</strong>
              </Label>
            </div>
          </div>
        </>
      }
      selection={{
        selectHandler: confirmDelete,
        selectClasses:
          'bg-red-700 dark:bg-red-600 hover:bg-red-800 dark:hover:bg-red-800 text-white',
        selectText: localize('com_ui_delete'),
      }}
    />
  );

  if (showDeleteDialog !== undefined && setShowDeleteDialog !== undefined) {
    return (
      <OGDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        {dialogContent}
      </OGDialog>
    );
  }

  return (
    <OGDialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <OGDialogTrigger asChild>
            <TooltipTrigger asChild>
              <button>
                <TrashIcon className="h-5 w-5" />
              </button>
            </TooltipTrigger>
          </OGDialogTrigger>
          <TooltipContent side="top" sideOffset={0} className={className}>
            {localize('com_ui_delete')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {dialogContent}
    </OGDialog>
  );
}
