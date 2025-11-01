
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sprout,
  CalendarDays,
  DollarSign,
  CheckCircle,
  Clock,
  Loader,
  Bug,
  ListTodo,
  Bot,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type CultivationStage } from '@/ai/flows/generate-cultivation-guide';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';

type Task = {
    text: string;
    completed: boolean;
};

type EnhancedCultivationStage = Omit<CultivationStage, 'tasks'> & {
    tasks: Task[];
};

type CultivationGuideData = {
    id: string;
    crop: string;
    variety: string;
    estimatedDurationDays: number;
    estimatedExpenses: number;
    stages: EnhancedCultivationStage[];
};


export default function ViewGuidePage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { t } = useTranslation();

    const { user } = useUser();
    const db = useFirestore();
    const { toast } = useToast();

    const guideDocRef = useMemoFirebase(() => {
        if (!db || !user?.uid || !id) return null;
        return doc(db, 'farmers', user.uid, 'cultivationGuides', id);
    }, [db, user?.uid, id]);

    const { data: guide, isLoading: isGuideLoading } = useDoc<CultivationGuideData>(guideDocRef);
    
    const [stages, setStages] = useState<EnhancedCultivationStage[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (guide) {
            // Ensure tasks are in the correct format
            const formattedStages = guide.stages.map(stage => ({
                ...stage,
                tasks: stage.tasks.map(task => 
                    typeof task === 'string' ? { text: task, completed: false } : task
                )
            }));
            setStages(formattedStages);
        }
    }, [guide]);

    const handleTaskChange = (stageIndex: number, taskIndex: number, completed: boolean) => {
        const newStages = [...stages];
        newStages[stageIndex].tasks[taskIndex].completed = completed;
        setStages(newStages);
        handleStageStatusUpdate(newStages, false); // Don't show toast for task changes
    };

    const handleStageStatusUpdate = async (updatedStages: EnhancedCultivationStage[], showToast = true) => {
        if (!guideDocRef) return;

        setIsUpdating(true);
        try {
            await updateDoc(guideDocRef, { stages: updatedStages });
            if (showToast) {
                toast({
                    title: t('stageUpdated'),
                    description: t('stageUpdatedDesc'),
                });
            }
        } catch (error) {
            console.error("Error updating stages:", error);
            toast({
                variant: 'destructive',
                title: t('error'),
                description: t('couldNotUpdateGuide'),
            });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleNextStage = () => {
        const activeIndex = stages.findIndex(s => s.status === 'active');
        
        if (activeIndex > -1) {
            const newStages = stages.map((stage, index) => {
                // Mark current active stage as completed and check all its tasks
                if (index === activeIndex) {
                    return { 
                        ...stage, 
                        status: 'completed' as const,
                        tasks: stage.tasks.map(task => ({ ...task, completed: true }))
                    };
                }
                // If there's a next stage, mark it as active
                if (index === activeIndex + 1) {
                    return { ...stage, status: 'active' as const };
                }
                return stage;
            });
            setStages(newStages);
            handleStageStatusUpdate(newStages);
        }
    }


    if (isGuideLoading) {
        return <GuideSkeleton />;
    }

    if (!guide) {
        return (
             <div className="text-center py-16">
                <h2 className="text-xl font-semibold">{t('guideNotFound')}</h2>
                <p className="text-muted-foreground mt-2">{t('guideNotFoundDesc')}</p>
                <Button asChild className="mt-4">
                    <Link href="/dashboard/my-guides">{t('goToMyGuides')}</Link>
                </Button>
            </div>
        )
    }

    const activeStageIndex = stages.findIndex(s => s.status === 'active');
    const allStagesCompleted = stages.every(s => s.status === 'completed');

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">{t('cultivationGuide')}: {guide.crop}</h1>
                    <p className="text-muted-foreground">{t('cultivationGuideDesc', { variety: guide.variety })}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('cropVariety')}</CardTitle>
                        <Sprout className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-2xl font-bold">{guide.crop} / {guide.variety}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('estDuration')}</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-2xl font-bold">{guide.estimatedDurationDays} {t('days')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('estExpenses')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="text-2xl font-bold">Rs.{guide.estimatedExpenses.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>{t('cultivationStages')}</CardTitle>
                    <CardDescription>{t('cultivationStagesDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Accordion type="single" collapsible defaultValue={`item-${activeStageIndex}`} className="w-full">
                        {stages.map((stage, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger className="text-lg">
                                    <div className="flex items-center gap-4">
                                        {stage.status === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                                        {stage.status === 'active' && <Loader className="h-6 w-6 text-blue-500" />}
                                        {stage.status === 'upcoming' && <Clock className="h-6 w-6 text-muted-foreground" />}
                                        <span>{stage.name}</span>
                                        <Badge variant="outline">{stage.duration}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-6">
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Bot className="h-5 w-5 text-primary" /> {t('aiInstruction')}</h4>
                                        <p className="text-muted-foreground">{stage.aiInstruction}</p>
                                    </div>

                                    {stage.pestAndDiseaseAlert && (
                                        <Alert variant="destructive">
                                            <Bug className="h-4 w-4" />
                                            <AlertTitle>{t('pestDiseaseAlert')}</AlertTitle>
                                            <AlertDescription>{stage.pestAndDiseaseAlert}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-2"><ListTodo className="h-5 w-5 text-primary"/> {t('tasksForStage')}</h4>
                                        <div className="space-y-2">
                                            {stage.tasks.map((task, taskIndex) => (
                                                <div key={taskIndex} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                                                    <Checkbox 
                                                        id={`task-${index}-${taskIndex}`} 
                                                        checked={task.completed}
                                                        onCheckedChange={(checked) => handleTaskChange(index, taskIndex, !!checked)}
                                                        disabled={stage.status !== 'active' || isUpdating} 
                                                    />
                                                    <label htmlFor={`task-${index}-${taskIndex}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {task.text}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
                <CardFooter className="p-6">
                    {allStagesCompleted ? (
                        <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 w-full">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>{t('cultivationComplete')}</AlertTitle>
                            <AlertDescription>
                                {t('cultivationCompleteDesc')}
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <Button onClick={handleNextStage} disabled={activeStageIndex === -1 || isUpdating}>
                            {isUpdating ? t('saving') : t('completeStageAndNext')}
                         </Button>
                    )}
                </CardFooter>
            </Card>

        </div>
    )
}

function GuideSkeleton() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-9 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
