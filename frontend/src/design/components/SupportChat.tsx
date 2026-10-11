import React, { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { api, errorMessage, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import { businessConfig, formatDate } from '../data';
import { useRemote } from '../hooks/useRemote';
import { isManager, type SupportMessage, type SupportTicket } from '../types';
import Icon from './Icon';

/** Who wrote a message, as the person reading the ticket should see it. */
export function messageAuthor(message: SupportMessage, viewerEmail?: string, ticket?: SupportTicket) {
  if (message.author === viewerEmail) return 'You';
  if (message.author === 'support') return message.authorName ? message.authorName + ' · Support' : 'Support team';
  if (ticket && message.author === ticket.email) return ticket.name;
  return message.authorName || message.author;
}

export function ChatBubble({ message, mine, name }: { message: SupportMessage; mine: boolean; name: string }) {
  const time = new Date(message.createdAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', timeZone: businessConfig.timezone });
  return <article className={'chat-bubble' + (mine ? ' mine' : '')}>
    <strong>{name}</strong>
    <p>{message.text}</p>
    <small>{formatDate(message.createdAt)} {time}{mine && <> · {message.readBy.length > 1 ? 'Read' : 'Sent'}</>}</small>
  </article>;
}

// The chat button in the homepage's bottom right corner. Customers chat in it directly; the team is pointed to
// Ticket support, and visitors are asked to sign in first so replies reach them.
export default function SupportChat() {
  const { user } = useAuth();
  const customer = user?.role === 'customer';
  const [open, setOpen] = useState(false);
  const tickets = useRemote<SupportTicket[]>(customer ? '/support' : null, []);
  const ticket = tickets.data[0];
  const history = useRemote<SupportMessage[]>(customer && open && ticket ? '/support/' + ticket._id + '/messages' : null, []);
  const [text, setText] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);

  // Check for replies now and then, and more often while the chat is open.
  useEffect(() => {
    if (!customer) return undefined;
    const timer = window.setInterval(() => { tickets.refresh(); if (open) history.refresh(); }, open ? 8000 : 30000);
    return () => window.clearInterval(timer);
  }, [customer, open, tickets.refresh, history.refresh]);
  // Opening the chat reads the messages, so the unread count drops once they load.
  useEffect(() => { if (open && history.data.length) tickets.refresh(); }, [open, history.data.length, tickets.refresh]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [history.data.length, open]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setError('');
    try {
      // The ticket is created with the first message, so an unused chat leaves nothing in the team's list.
      const id = ticket?._id || (await api<SupportTicket>('/support', jsonOptions('POST')))._id;
      await api('/support/' + id + '/messages', jsonOptions('POST', { text }));
      setText('');
      tickets.refresh(); history.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  const sendOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } };
  const unread = customer && !open ? ticket?.unread || 0 : 0;

  return <div className="support-chat">
    {open && <section className="support-chat-panel" role="dialog" aria-label="Ticket support chat">
      <header>
        <div><strong>Ticket support</strong><small>{customer ? 'We usually reply within the day.' : 'Questions about a clean? Talk to us.'}</small></div>
        <button aria-label="Close chat" onClick={() => setOpen(false)}><Icon name="close" size={18} /></button>
      </header>
      {!user && <div className="support-chat-note">
        <p>Sign in to chat with our team. Your conversation stays in your account, so our replies always reach you. You can also chat from Ticket support in your dashboard.</p>
        <Link className="button" href="/login">Sign in to chat</Link>
      </div>}
      {user && !customer && <div className="support-chat-note">
        <p>{isManager(user.role) ? 'Customer chats arrive in Ticket support, where you can answer them or assign them to staff.' : 'Customer chats assigned to you are in Ticket support.'}</p>
        <Link className="button" href="/support">Open ticket support</Link>
      </div>}
      {customer && <>
        <div className="support-chat-messages" aria-live="polite">
          {!history.data.length && !history.loading && <p className="support-chat-empty">Hi {user.name.split(' ')[0]}! How can we help with your clean?</p>}
          {history.data.map((m) => <ChatBubble key={m._id} message={m} mine={m.author === user.email} name={messageAuthor(m, user.email)} />)}
          <div ref={end} />
        </div>
        {(error || tickets.error || history.error) && <p className="support-chat-error" role="alert">{error || tickets.error || history.error}</p>}
        <form className="support-chat-form" onSubmit={send}>
          <textarea aria-label="Message" rows={2} maxLength={2000} placeholder="Write a message…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={sendOnEnter} />
          <button aria-label="Send message" disabled={busy || !text.trim()}><Icon name="arrow" size={18} /></button>
        </form>
      </>}
    </section>}
    <button className="support-chat-toggle" aria-expanded={open} aria-label={open ? 'Close ticket support chat' : 'Open ticket support chat'} onClick={() => setOpen(!open)}>
      <Icon name={open ? 'close' : 'message'} size={24} />
      {unread > 0 && <span className="support-chat-badge">{unread}</span>}
    </button>
  </div>;
}
