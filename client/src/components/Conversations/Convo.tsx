import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import { Constants } from 'librechat-data-provider';
import { useGetEndpointsQuery } from 'librechat-data-provider/react-query';
import { Check, X } from 'lucide-react';
import type { MouseEvent, FocusEvent, KeyboardEvent } from 'react';
import { useConversations, useNavigateToConvo, useMediaQuery } from '~/hooks';
import { useUpdateConversationMutation } from '~/data-provider';
import EndpointIcon from '~/components/Endpoints/EndpointIcon';
import { NotificationSeverity } from '~/common';
import { useToastContext } from '~/Providers';
import { ConvoOptions } from './ConvoOptions';
import { cn } from '~/utils';
import store from '~/store';

type KeyEvent = KeyboardEvent<HTMLInputElement>;

export default function Conversation({ conversation, retainView, toggleNav, isLatestConvo }) {
  const params = useParams();
  const currentConvoId = useMemo(() => params.conversationId, [params.conversationId]);
  const updateConvoMutation = useUpdateConversationMutation(currentConvoId ?? '');
  const activeConvos = useRecoilValue(store.allConversationsSelector);
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { navigateWithLastTools } = useNavigateToConvo();
  const { refreshConversations } = useConversations();
  const { showToast } = useToastContext();
  const { conversationId, title } = conversation;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [titleInput, setTitleInput] = useState(title);
  const [renaming, setRenaming] = useState(false);
  const [isPopoverActive, setIsPopoverActive] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  const clickHandler = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && (event.ctrlKey || event.metaKey)) {
      toggleNav();
      return;
    }

    event.preventDefault();
    if (currentConvoId === conversationId || isPopoverActive) {
      return;
    }

    toggleNav();

    // set document title
    document.title = title;
    /* Note: Latest Message should not be reset if existing convo */
    navigateWithLastTools(conversation, !conversationId || conversationId === Constants.NEW_CONVO);
  };

  const renameHandler = (e: MouseEvent<HTMLButtonElement>) => {
    setIsPopoverActive(false);
    setTitleInput(title);
    setRenaming(true);
  };

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [renaming]);

  const onRename = (e: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLInputElement> | KeyEvent) => {
    e.preventDefault();
    setRenaming(false);
    if (titleInput === title) {
      return;
    }
    updateConvoMutation.mutate(
      { conversationId, title: titleInput },
      {
        onSuccess: () => refreshConversations(),
        onError: () => {
          setTitleInput(title);
          showToast({
            message: 'Failed to rename conversation',
            severity: NotificationSeverity.ERROR,
            showIcon: true,
          });
        },
      },
    );
  };

  const handleKeyDown = (e: KeyEvent) => {
    if (e.key === 'Escape') {
      setTitleInput(title);
      setRenaming(false);
    } else if (e.key === 'Enter') {
      onRename(e);
    }
  };

  const cancelRename = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setTitleInput(title);
    setRenaming(false);
  };

  const isActiveConvo =
    currentConvoId === conversationId ||
    (isLatestConvo && currentConvoId === 'new' && activeConvos[0] && activeConvos[0] !== 'new');

  return (
    <div
      className={cn(
        'group relative mt-2 flex h-9 items-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700',
        isActiveConvo ? 'bg-gray-200 dark:bg-gray-700' : '',
        isSmallScreen ? 'h-12' : '',
      )}
    >
      {renaming ? (
        <div className="absolute inset-0 z-20 flex w-full items-center rounded-lg bg-gray-200 p-1.5 dark:bg-gray-700">
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded bg-transparent p-0.5 text-sm leading-tight outline-none"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-1">
            <button onClick={cancelRename}>
              <X className="transition-color h-4 w-4 duration-200 ease-in-out hover:opacity-70" />
            </button>
            <button onClick={onRename}>
              <Check className="transition-color h-4 w-4 duration-200 ease-in-out hover:opacity-70" />
            </button>
          </div>
        </div>
      ) : (
        <a
          href={`/c/${conversationId}`}
          data-testid="convo-item"
          onClick={clickHandler}
          className={cn(
            'flex grow cursor-pointer items-center gap-2 overflow-hidden whitespace-nowrap break-all rounded-lg px-2 py-2',
            isActiveConvo ? 'bg-gray-200 dark:bg-gray-700' : '',
          )}
          title={title}
        >
          <EndpointIcon
            conversation={conversation}
            endpointsConfig={endpointsConfig}
            size={20}
            context="menu-item"
          />
          {!renaming && (
            <div className="relative line-clamp-1 flex-1 grow overflow-hidden">{title}</div>
          )}
          {isActiveConvo ? (
            <div
              className={cn(
                'absolute bottom-0 right-0 top-0 w-20 rounded-r-lg bg-gradient-to-l',
                !renaming ? 'from-gray-200 from-40% to-transparent dark:from-gray-700' : '',
              )}
            />
          ) : (
            <div className="absolute bottom-0 right-0 top-0 w-20 rounded-r-lg bg-gradient-to-l from-gray-50 from-0% to-transparent group-hover:from-gray-200 group-hover:from-40% dark:from-gray-850 dark:group-hover:from-gray-700" />
          )}
        </a>
      )}
      <div
        className={cn(
          'mr-2',
          isPopoverActive || isActiveConvo ? 'flex' : 'hidden group-hover:flex',
        )}
      >
        <ConvoOptions
          conversation={conversation}
          retainView={retainView}
          renameHandler={renameHandler}
          isPopoverActive={isPopoverActive}
          setIsPopoverActive={setIsPopoverActive}
          isActiveConvo={isActiveConvo}
        />
      </div>
    </div>
  );
}
