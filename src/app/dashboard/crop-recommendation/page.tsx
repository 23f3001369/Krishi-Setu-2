
'use client';

import { useActionState, useRef, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { aiCropRecommendation } from '@/ai/flows/ai-crop-recommendation';
import { agriQa } from '@/ai/flows/agri-qa';
import { extractSoilHealthInfo } from '@/ai/flows/extract-soil-health-info';
import { transcribeAudio } from '@/ai/flows/speech-to-text';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Leaf, Lightbulb, Upload, Bot, Sparkles, Wand2, Mic, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { useTranslation } from '@/hooks/use-translation';

type RecommendationState = {
  data?: {
    optimalCrops: string;
    reasoning: string;
  };
  error?: string;
};

const initialRecommendationState: RecommendationState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useTranslation();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      <Bot className="mr-2 h-4 w-4" />
      {pending ? t('gettingRecommendations') : t('getRecommendations')}
    </Button>
  );
}

async function recommendCrops(
  prevState: RecommendationState,
  formData: FormData
): Promise<RecommendationState> {
  const soilAnalysis = formData.get('soilAnalysis') as string;
  const soilHealthCardImage = formData.get('soilHealthCardImage') as string;
  const realTimeWeatherConditions = "Temp: 25°C, Humidity: 70%, Wind: 10km/h, Last rainfall: 2 days ago";
  const seasonalData = "Current season: Late Spring, Average rainfall for this period: 50mm, Frost risk: Low";
  const farmerId = formData.get('farmerId') as string;

  if (
    (!soilAnalysis && !soilHealthCardImage)
  ) {
    return { error: 'Soil details are required.' };
  }
  
  if (!farmerId) {
    return { error: 'User not authenticated. Please log in.' };
  }

  try {
    const result = await aiCropRecommendation({
      soilAnalysis: soilAnalysis || undefined,
      soilHealthCardImage: soilHealthCardImage || undefined,
      realTimeWeatherConditions,
      seasonalData,
      farmerId,
    });
    return { data: result };
  } catch (e) {
    console.error(e);
    return {
      error: 'Failed to get recommendations. Please try again.',
    };
  }
}

function GeneralAgriBot() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [micDisabled, setMicDisabled] = useState(false);
    const { t, langName } = useTranslation();

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
            setError(t('micNotSupported'));
            setMicDisabled(true);
        }
    }, [t]);

    const handleMicClick = async () => {
        setError(null);
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = recorder;
                audioChunksRef.current = [];

                recorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                recorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64Audio = reader.result as string;
                        setIsLoading(true);
                        setQuestion(t('transcribingAudio'));
                        try {
                            const result = await transcribeAudio({ audio: base64Audio });
                            setQuestion(result.text);
                        } catch (e) {
                            console.error(e);
                            setError(t('couldNotTranscribe'));
                            setQuestion('');
                        } finally {
                            setIsLoading(false);
                        }
                    };
                    stream.getTracks().forEach(track => track.stop());
                };

                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error(err);
                let errorMessage: React.ReactNode = t('micAccessError');
                if (err instanceof DOMException) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        errorMessage = t('micPermissionDenied');
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        errorMessage = t('micNotFound');
                    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError' || err.name === 'audio-capture') {
                        errorMessage = (
                            <div>
                                <p className="font-bold">{t('micUnavailable')}</p>
                                <p className="mt-2">{t('micUnavailableDesc')}</p>
                            </div>
                        );
                        setMicDisabled(true);
                    }
                }
                setError(errorMessage);
            }
        }
    };

    const handleAskQuestion = async () => {
        if (!question || question === t('transcribingAudio')) return;
        setIsLoading(true);
        setError(null);
        setAnswer('');
        try {
            const result = await agriQa({ question, language: langName });
            setAnswer(result.answer);
        } catch(e) {
            console.error(e);
            setError(t('failedToGetAnswer'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />{t('generalAgriBot')}</CardTitle>
                <CardDescription>
                {t('generalAgriBotDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                    <Label htmlFor="general-question">{t('yourQuestion')}</Label>
                    <div className="flex gap-2">
                        <Textarea 
                            id="general-question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={t('generalQuestionPlaceholder')}
                            disabled={isLoading}
                        />
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={handleMicClick} 
                            disabled={micDisabled || isLoading}
                            title={micDisabled ? t('micUnavailable') : (isRecording ? t('stopRecording') : t('useMicrophone'))}
                            className="h-auto"
                        >
                            <Mic className={isRecording ? 'text-primary animate-pulse' : ''} />
                        </Button>
                    </div>
                </div>
                 {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('micError')}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter className="p-6">
                <Button onClick={handleAskQuestion} disabled={isLoading || !question || question === t('transcribingAudio')}>
                    <Bot className="mr-2 h-4 w-4" />
                    {isLoading ? (question === t('transcribingAudio') ? t('transcribing') : t('thinking')) : t('askAgriBot')}
                </Button>
            </CardFooter>
            {answer && (
                 <CardFooter className="p-6 pt-0">
                    <Alert>
                        <Bot className="h-4 w-4" />
                        <AlertTitle>{t('answer')}</AlertTitle>
                        <AlertDescription>
                            <p>{answer}</p>
                        </AlertDescription>
                    </Alert>
                </CardFooter>
            )}
        </Card>
    )
}

export default function CropRecommendationPage() {
  const [recommendationState, formAction] = useActionState(recommendCrops, initialRecommendationState);
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenImageInputRef = useRef<HTMLInputElement>(null);
  
  const [soilAnalysis, setSoilAnalysis] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const { t } = useTranslation();


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        if (hiddenImageInputRef.current) {
          hiddenImageInputRef.current.value = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (hiddenImageInputRef.current) {
      hiddenImageInputRef.current.value = '';
    }
  };

  const handleExtract = async () => {
    if (!hiddenImageInputRef.current?.value) return;

    setIsExtracting(true);
    setExtractError(null);
    try {
        const result = await extractSoilHealthInfo({
            soilHealthCardImage: hiddenImageInputRef.current.value
        });
        setSoilAnalysis(result.soilAnalysisText);
        setActiveTab('manual'); // Switch to manual tab to show the result
    } catch(e) {
        console.error(e);
        setExtractError(t('failedToExtractInfo'));
    } finally {
        setIsExtracting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className='mb-8'>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('aiCropTools')}
        </h1>
        <p className="text-muted-foreground">
          {t('aiCropToolsDesc')}
        </p>
      </div>

      <GeneralAgriBot />

      <Card className="max-w-3xl mx-auto">
        <form action={formAction}>
          <CardHeader>
            <CardTitle>{t('specificCropRecommendation')}</CardTitle>
            <CardDescription>
              {t('specificCropRecommendationDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <input type="hidden" name="farmerId" value={user?.uid || ''} />
            <div className="space-y-2">
              <Label>{t('soilDetails')}</Label>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">{t('manualEntry')}</TabsTrigger>
                  <TabsTrigger value="upload">{t('uploadReport')}</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="pt-4 space-y-6">
                  <Textarea
                    name="soilAnalysis"
                    placeholder={t('soilAnalysisPlaceholder')}
                    id="soilAnalysis"
                    value={soilAnalysis}
                    onChange={(e) => setSoilAnalysis(e.target.value)}
                  />
                  <div className="space-y-2">
                      <Label htmlFor="realTimeWeatherConditions">{t('weatherConditions')}</Label>
                      <Textarea
                          name="realTimeWeatherConditions"
                          placeholder={t('weatherConditionsPlaceholder')}
                          id="realTimeWeatherConditions"
                          required
                      />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="seasonalData">{t('seasonalData')}</Label>
                      <Textarea
                          name="seasonalData"
                          placeholder={t('seasonalDataPlaceholder')}
                          id="seasonalData"
                          required
                      />
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="pt-4">
                  {!imagePreview ? (
                    <div
                      className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center bg-muted/20 hover:bg-muted/40 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t('clickToUploadSoilCard')}
                      </p>
                      <Input
                        ref={fileInputRef}
                        id="soil-report-image"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                        <Image
                          src={imagePreview}
                          alt={t('soilReportPreview')}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                            disabled={isExtracting}
                        >
                            {t('removeImage')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleExtract}
                            disabled={isExtracting}
                        >
                            <Wand2 className="mr-2 h-4 w-4" />
                            {isExtracting ? t('extracting') : t('extract')}
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    type="hidden"
                    name="soilHealthCardImage"
                    ref={hiddenImageInputRef}
                  />
                   {extractError && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTitle>{t('extractionError')}</AlertTitle>
                        <AlertDescription>{extractError}</AlertDescription>
                    </Alert>
                )}
                </TabsContent>
              </Tabs>
            </div>
            
            {recommendationState.data && (
              <div className="space-y-6 pt-4 border-t">
                <Alert className="bg-primary/5 border-primary/20">
                  <Leaf className="h-4 w-4 !text-primary" />
                  <AlertTitle className="text-primary">{t('optimalCrops')}</AlertTitle>
                  <AlertDescription>
                    <p className="text-lg font-semibold">
                      {recommendationState.data.optimalCrops}
                    </p>
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>{t('reasoning')}</AlertTitle>
                  <AlertDescription>
                    <p>{recommendationState.data.reasoning}</p>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {recommendationState.error && !recommendationState.data && (
              <Alert variant="destructive">
                <AlertTitle>{t('error')}</AlertTitle>
                <AlertDescription>{recommendationState.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="p-6">
            <SubmitButton />
          </CardFooter>
        </form>

      </Card>

    </div>
  );
}
