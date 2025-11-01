
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, User as UserIcon } from 'lucide-react';
import { agriQa } from '@/ai/flows/agri-qa';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/use-translation';

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

export default function KrishiAIChatPage() {
  const { user, isUserLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { langName } = useTranslation();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await agriQa({ question: input, language: langName });
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: response.answer,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `bot-error-${Date.now()}`,
        role: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('AI Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Krishi AI</h1>
        <p className="text-muted-foreground">Your personal AI agricultural assistant.</p>
      </div>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Chat with Krishi-Bot</CardTitle>
          <CardDescription>Ask any farming-related question.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'bot' && (
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-md rounded-lg px-4 py-3 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p>{message.text}</p>
                  </div>
                   {message.role === 'user' && (
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL ?? undefined} />
                        <AvatarFallback>
                            {isUserLoading ? <Skeleton className="h-8 w-8 rounded-full" /> : (user?.displayName?.charAt(0) || <UserIcon />)}
                        </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                     <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-3">
                        <Skeleton className="h-4 w-4 animate-bounce" />
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your question here..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
