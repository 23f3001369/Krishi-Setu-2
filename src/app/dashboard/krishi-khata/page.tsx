
'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, Trash2, TrendingUp, TrendingDown, MinusCircle, CalendarIcon } from "lucide-react";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';


type Transaction = {
    id: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    date: string | Timestamp;
    createdAt?: Timestamp;
};

const expenseCategories = ['Seeds', 'Fertilizer', 'Pesticides', 'Labor', 'Machinery', 'Utilities', 'Other'];
const incomeCategories = ['Sale', 'Subsidy', 'Other'];

export default function KrishiKhataPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();
  
  const heroImage = PlaceHolderImages.find(p => p.id === "krishi-khata-hero");
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'farmers', user.uid, 'transactions');
  }, [db, user?.uid]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const { totalIncome, totalExpenses, profitLoss } = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0, profitLoss: 0 };
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      profitLoss: income - expenses,
    };
  }, [transactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'> & { date: Date }) => {
    if (!transactionsQuery) return;
    try {
        await addDoc(transactionsQuery, {
            ...transaction,
            createdAt: Timestamp.now(),
            date: Timestamp.fromDate(transaction.date),
        });
        toast({ title: t('success'), description: t('transactionAdded') });
        setIsDialogOpen(false);
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: t('error'), description: t('couldNotAddTransaction') });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!transactionsQuery) return;
    try {
        await deleteDoc(doc(transactionsQuery.firestore, transactionsQuery.path, id));
        toast({ title: t('success'), description: t('transactionDeleted') });
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: t('error'), description: t('couldNotDeleteTransaction') });
    }
  };
  
  const formatDate = (date: string | Timestamp) => {
      if (date instanceof Timestamp) {
          return date.toDate().toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('krishiKhata')}</h1>
        <p className="text-muted-foreground">{t('krishiKhataSubtitle')}</p>
      </div>

      {heroImage && (
        <div className="relative h-48 w-full overflow-hidden rounded-lg">
            <Image src={heroImage.imageUrl} alt={heroImage.description} data-ai-hint={heroImage.imageHint} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <h2 className="text-4xl font-bold text-white font-headline">{t('financialOverview')}</h2>
            </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>{t('totalIncome')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">Rs.{totalIncome.toLocaleString()}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>{t('totalExpenses')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">Rs.{totalExpenses.toLocaleString()}</div>}
          </CardContent>
        </Card>
        <Card className={profitLoss >= 0 ? 'border-green-500/50' : 'border-red-500/50'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>{t('profitLoss')}</CardTitle>
            <MinusCircle className={`h-4 w-4 ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? <Skeleton className="h-8 w-32" /> : (
                <>
                 <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rs.{Math.abs(profitLoss).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{t(profitLoss >= 0 ? 'profit' : 'loss')}</p>
                </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>{t('transactionHistory')}</CardTitle>
            <CardDescription>{t('transactionHistoryDesc')}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addTransaction')}
                </Button>
            </DialogTrigger>
            <TransactionDialog onSubmit={addTransaction} />
          </Dialog>
        </CardHeader>
        <CardContent className="p-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('date')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead>{t('category')}</TableHead>
                        <TableHead>{t('description')}</TableHead>
                        <TableHead className="text-right">{t('amount')}</TableHead>
                        <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : transactions && transactions.sort((a,b) => (b.date as Timestamp).toMillis() - (a.date as Timestamp).toMillis()).map(t => (
                        <TableRow key={t.id}>
                            <TableCell>{formatDate(t.date)}</TableCell>
                            <TableCell>
                                {t.type === 'income' ? 
                                    <span className="flex items-center gap-2 text-green-600"><ArrowUpCircle size={16}/> {t('income')}</span> : 
                                    <span className="flex items-center gap-2 text-red-600"><ArrowDownCircle size={16}/> {t('expense')}</span>
                                }
                            </TableCell>
                            <TableCell>{t.category}</TableCell>
                            <TableCell>{t.description}</TableCell>
                            <TableCell className="text-right font-medium">Rs.{t.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {!isLoading && transactions?.length === 0 && (
                <div className="text-center text-muted-foreground p-8">{t('noTransactionsYet')}</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionDialog({ onSubmit }: { onSubmit: (data: Omit<Transaction, 'id' | 'date'> & { date: Date }) => void}) {
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { t } = useTranslation();

    const categories = useMemo(() => {
        const cats = type === 'income' ? incomeCategories : expenseCategories;
        return cats.map(c => ({ value: c, label: t(c.toLowerCase()) }));
    }, [type, t]);
    
    React.useEffect(() => {
        setCategory('');
    }, [type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount || !date) {
            // Basic validation
            return;
        }
        onSubmit({
            type,
            category,
            amount: Number(amount),
            description,
            date
        });
        // Reset form
        setCategory('');
        setAmount('');
        setDescription('');
        setDate(new Date());
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('addNewTransaction')}</DialogTitle>
                <DialogDescription>
                    {t('addNewTransactionDesc')}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{t('transactionType')}</Label>
                        <Select onValueChange={(v: 'income' | 'expense') => setType(v)} value={type}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectType')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">{t('expense')}</SelectItem>
                                <SelectItem value="income">{t('income')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>{t('category')}</Label>
                         <Select onValueChange={setCategory} value={category}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectCategory')} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">{t('amountInCurrency')}</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">{t('description')}</Label>
                        <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('descriptionPlaceholder')} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="date">{t('date')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>{t('pickADate')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={(date) => date > new Date()}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">{t('cancel')}</Button>
                    </DialogClose>
                    <Button type="submit">{t('saveTransaction')}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
