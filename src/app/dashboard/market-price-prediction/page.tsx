
'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Bot,
  TrendingUp,
  TrendingDown,
  CircleDot,
  Lightbulb,
  Loader,
  DollarSign,
  Wheat,
  MapPin,
  BarChart,
} from 'lucide-react';
import {
  marketPricePrediction,
} from '@/ai/flows/market-price-prediction';
import { Skeleton } from '@/components/ui/skeleton';
import { z } from 'zod';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useTranslation } from '@/hooks/use-translation';

// Define schemas and types here, in the client component.
export const MarketPricePredictionInputSchema = z.object({
  cropName: z.string().describe('The name of the crop (e.g., "Wheat", "Tomato").'),
  marketLocation: z.string().describe('The name of the market or region (e.g., "Nashik, Maharashtra", "Indore").'),
});
export type MarketPricePredictionInput = z.infer<typeof MarketPricePredictionInputSchema>;

export const MarketPricePredictionOutputSchema = z.object({
  predictedPrice: z.string().describe('The predicted price range in Indian Rupees (Rs.) per standard unit (e.g., "Rs. 1800 - Rs. 2200 per quintal").'),
  trend: z.enum(['upward', 'downward', 'stable']).describe('The anticipated price trend over the next 2-4 weeks.'),
  trendConfidence: z.object({
      upward: z.number().describe('The confidence percentage (0-100) that the price trend will be upward.'),
      downward: z.number().describe('The confidence percentage (0-100) that the price trend will be downward.'),
      stable: z.number().describe('The confidence percentage (0-100) that the price trend will be stable.'),
  }).describe('The confidence levels for each possible trend. The sum must be 100.'),
  reasoning: z.string().describe('A brief explanation for the prediction, mentioning factors like seasonality, demand, and recent events.'),
});
export type MarketPricePredictionOutput = z.infer<typeof MarketPricePredictionOutputSchema>;


export default function MarketPricePredictionPage() {
  const [formData, setFormData] = useState({
    cropName: '',
    marketLocation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MarketPricePredictionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async () => {
    if (!formData.cropName || !formData.marketLocation) {
      setError(t('fillCropAndMarket'));
      return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const prediction = await marketPricePrediction({
        cropName: formData.cropName,
        marketLocation: formData.marketLocation,
      });
      setResult(prediction);
    } catch (e) {
      console.error(e);
      setError(t('failedToGetPrediction'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const TrendIcon = ({ trend }: { trend: 'upward' | 'downward' | 'stable' }) => {
    switch (trend) {
      case 'upward': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'downward': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <CircleDot className="h-4 w-4 text-blue-500" />;
    }
  };

  const trendChartData = useMemo(() => {
    if (!result?.trendConfidence) return [];
    return [
      { name: t('upward'), value: result.trendConfidence.upward, fill: 'hsl(var(--chart-1))' },
      { name: t('downward'), value: result.trendConfidence.downward, fill: 'hsl(var(--chart-2))' },
      { name: t('stable'), value: result.trendConfidence.stable, fill: 'hsl(var(--chart-3))' },
    ].filter(item => item.value > 0);
  }, [result, t]);

  const chartConfig = {
      upward: { label: t('upward'), color: 'hsl(var(--chart-1))' },
      downward: { label: t('downward'), color: 'hsl(var(--chart-2))' },
      stable: { label: t('stable'), color: 'hsl(var(--chart-3))' },
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (percent === 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('mandiPricePrediction')}
        </h1>
        <p className="text-muted-foreground">
          {t('mandiPricePredictionDesc')}
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t('getPricePrediction')}</CardTitle>
          <CardDescription>
            {t('getPricePredictionDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cropName" className="flex items-center gap-1"><Wheat className="w-4 h-4" /> {t('cropName')}</Label>
              <Input
                id="cropName"
                name="cropName"
                placeholder={t('cropNamePlaceholder')}
                value={formData.cropName}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketLocation" className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {t('marketLocation')}</Label>
              <Input
                id="marketLocation"
                name="marketLocation"
                placeholder={t('marketLocationPlaceholder')}
                value={formData.marketLocation}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6">
          <Button
            onClick={handlePredict}
            disabled={isLoading || !formData.cropName || !formData.marketLocation}
          >
            <Bot className="mr-2 h-4 w-4" />
            {isLoading ? t('analyzingMarket') : t('knowPrice')}
          </Button>
        </CardFooter>
      </Card>
      
      {isLoading && <ResultSkeleton />}

      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>{t('predictionError')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t('predictionFor', { crop: formData.cropName, market: formData.marketLocation })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
             <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted flex flex-col items-center justify-center text-center">
                     <p className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> {t('predictedPrice')}</p>
                     <p className="text-2xl font-bold text-primary">{result.predictedPrice}</p>
                </div>
                 <div className="p-4 rounded-lg bg-muted flex flex-col items-center justify-center text-center">
                     <p className="text-sm text-muted-foreground flex items-center gap-1"><BarChart className="w-3 h-3" /> {t('mostLikelyTrend')}</p>
                     <p className="text-2xl font-bold capitalize flex items-center gap-2">
                        <TrendIcon trend={result.trend} />
                        {t(result.trend)}
                    </p>
                </div>
            </div>

            {trendChartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('trendConfidence')}</CardTitle>
                        <CardDescription>{t('trendConfidenceDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 flex items-center justify-center">
                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie 
                                    data={trendChartData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100}
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {trendChartData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>{t('analystReasoning')}</AlertTitle>
              <AlertDescription>{result.reasoning}</AlertDescription>
            </Alert>

             <Alert variant="default" className="text-xs">
                <Bot className="h-4 w-4" />
                <AlertTitle>{t('disclaimer')}</AlertTitle>
                <AlertDescription>
                    {t('predictionDisclaimer')}
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultSkeleton() {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <Skeleton className="h-7 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                 <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-40 w-full" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    )
}
