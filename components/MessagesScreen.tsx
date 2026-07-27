import React from 'react';
import { CheckCircle2, MessageCircle, Search } from 'lucide-react';
import { useChatStore } from '../stores/useChatStore';
import { Input } from './ui/input';

const conversations = [
  { id: 'driver-1', name: 'Chinedu A.', initials: 'CA', message: 'I will meet you beside the bus stop.', time: '2m', unread: 2 },
  { id: 'rider-2', name: 'Blessing O.', initials: 'BO', message: 'Thanks for the smooth trip.', time: 'Thu', unread: 0 },
  { id: 'driver-3', name: 'Emmanuel K.', initials: 'EK', message: 'Your booking request was accepted.', time: 'Mon', unread: 0 },
];

const MessagesScreen: React.FC = () => {
  const openChat = useChatStore((state) => state.openChat);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-950">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Conversations stay connected to each trip.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        <Input className="h-11 rounded-xl border-slate-200 bg-white pl-10" placeholder="Search conversations" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => openChat(conversation.name, conversation.id)}
            className="flex min-h-20 w-full items-center gap-3 border-b border-slate-100 p-4 text-left last:border-0 hover:bg-slate-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-extrabold text-white">
              {conversation.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-extrabold text-slate-950">{conversation.name}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-700" />
              </span>
              <span className="mt-1 block truncate text-xs text-slate-500">{conversation.message}</span>
            </span>
            <span className="self-start pt-0.5 text-right">
              <span className="block text-[10px] font-semibold text-slate-400">{conversation.time}</span>
              {conversation.unread > 0 ? (
                <span className="mt-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white">
                  {conversation.unread}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-blue-50 p-4 text-center">
        <MessageCircle className="mx-auto h-5 w-5 text-blue-700" />
        <p className="mt-2 text-xs leading-5 text-blue-800">For privacy, conversations open after a match or booking request.</p>
      </div>
    </div>
  );
};

export default MessagesScreen;
