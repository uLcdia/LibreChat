import { memo } from 'react';
import { useRecoilValue } from 'recoil';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useGetMessagesByConvoId } from 'librechat-data-provider/react-query';
import type { ChatFormValues } from '~/common';
import { ChatContext, useFileMapContext, ChatFormProvider } from '~/Providers';
import MessagesView from './Messages/MessagesView';
import { useChatHelpers, useSSE } from '~/hooks';
import { Spinner } from '~/components/svg';
import Presentation from './Presentation';
import ChatForm from './Input/ChatForm';
import { buildTree } from '~/utils';
import Landing from './Landing';
import Header from './Header';
import store from '~/store';

function ChatView({ index = 0 }: { index?: number }) {
  const { conversationId } = useParams();
  const submissionAtIndex = useRecoilValue(store.submissionByIndex(0));
  useSSE(submissionAtIndex);

  const fileMap = useFileMapContext();

  const { data: messagesTree = null, isLoading } = useGetMessagesByConvoId(conversationId ?? '', {
    select: (data) => {
      const dataTree = buildTree({ messages: data, fileMap });
      return dataTree?.length === 0 ? null : dataTree ?? null;
    },
    enabled: !!fileMap,
  });

  const chatHelpers = useChatHelpers(index, conversationId);
  const methods = useForm<ChatFormValues>({
    defaultValues: { text: '' },
  });

  return (
    <ChatFormProvider
      reset={methods.reset}
      control={methods.control}
      setValue={methods.setValue}
      register={methods.register}
      getValues={methods.getValues}
      handleSubmit={methods.handleSubmit}
    >
      <ChatContext.Provider value={chatHelpers}>
        <Presentation useSidePanel={true}>
          {isLoading && conversationId !== 'new' ? (
            <div className="flex h-screen items-center justify-center">
              <Spinner className="opacity-0" />
            </div>
          ) : messagesTree && messagesTree.length !== 0 ? (
            <MessagesView messagesTree={messagesTree} Header={<Header />} />
          ) : (
            <Landing Header={<Header />} />
          )}
          <div className="w-full border-t-0 pl-0 pt-2 dark:border-white/20 md:w-[calc(100%-.5rem)] md:border-t-0 md:border-transparent md:pl-0 md:pt-0 md:dark:border-transparent">
            <ChatForm index={index} />
          </div>
        </Presentation>
      </ChatContext.Provider>
    </ChatFormProvider>
  );
}

export default memo(ChatView);
