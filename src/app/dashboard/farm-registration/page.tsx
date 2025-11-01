

"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Check, MapPin, Link as LinkIcon, ChevronsRight, ChevronsLeft, Send, X, Plus } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";


const totalSteps = 3;

export default function FarmRegistrationPage() {
  const searchParams = useSearchParams();
  const farmId = searchParams.get('id');
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(!!farmId);
  const [formData, setFormData] = useState({
    farmName: "",
    farmSize: "",
    mainCrops: "",
    address: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const farmDocRef = useMemoFirebase(() => {
    if (!db || !farmId) return null;
    return doc(db, 'farms', farmId);
  }, [db, farmId]);

  useEffect(() => {
    if (farmDocRef) {
      setIsLoading(true);
      getDoc(farmDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            farmName: data.name || '',
            farmSize: data.size?.toString() || '',
            mainCrops: Array.isArray(data.mainCrops) ? data.mainCrops.join(', ') : '',
            address: data.location || '',
          });
          setPhotos(data.photos || []);
        } else {
          toast({ variant: 'destructive', title: t('error'), description: t('farmNotFound') });
        }
      }).catch(error => {
        console.error("Error fetching farm document:", error);
        toast({ variant: 'destructive', title: t('error'), description: t('couldNotFetchFarm') });
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [farmDocRef, toast, t]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const addPhotoUrl = (url: string) => {
    if (url && !photos.includes(url)) {
      setPhotos(prev => [...prev, url]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  const isStep1Valid = formData.farmName.trim() !== "" && formData.farmSize.trim() !== "" && formData.mainCrops.trim() !== "";
  const isStep2Valid = formData.address.trim() !== "";

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) return;
    if (step === 2 && !isStep2Valid) return;
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };
  
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  
  const handleSubmit = async () => {
    if (!user || !db) {
        toast({
            variant: 'destructive',
            title: t('error'),
            description: t('mustBeLoggedInToRegister'),
        });
        return;
    }

    const farmData = {
        farmerId: user.uid,
        name: formData.farmName,
        size: Number(formData.farmSize),
        mainCrops: formData.mainCrops.split(',').map(s => s.trim()),
        location: formData.address,
        photos: photos,
    };

    try {
        if (farmDocRef) {
             await updateDoc(farmDocRef, farmData);
             toast({
                title: t('farmUpdated'),
                description: t('farmUpdatedDesc'),
             });
        } else {
            const farmsCollectionRef = collection(db, 'farms');
            await addDoc(farmsCollectionRef, farmData);
            toast({
                title: t('registrationComplete'),
                description: t('registrationCompleteDesc'),
            });
        }
        setIsSubmitted(true);
    } catch (error) {
        console.error("Error writing document: ", error);
        toast({
            variant: 'destructive',
            title: farmId ? t('updateFailed') : t('registrationFailed'),
            description: t('couldNotSaveFarm'),
        });
    }
  };

  const progress = (step / totalSteps) * 100;

  if (isSubmitted) {
    return (
        <div className="w-full max-w-2xl mx-auto">
            <Card className="w-full">
                <CardHeader className="items-center text-center p-6">
                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                        <Check className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>{farmId ? t('updateSuccessful') : t('registrationComplete')}</CardTitle>
                    <CardDescription>{farmId ? t('farmUpdatedDesc') : t('registrationCompleteDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Alert>
                        <Send className="h-4 w-4" />
                        <AlertTitle>{t('whatsNext')}</AlertTitle>
                        <AlertDescription>
                            {t('whatsNextDesc')}
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="p-6">
                    <Button className="w-full" onClick={() => window.location.href = '/dashboard/profile'}>{t('goToMyProfile')}</Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-8 w-full p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">{farmId ? t('editYourFarm') : t('registerYourFarm')}</h1>
            <p className="text-muted-foreground">{t(farmId ? 'editFarmDesc' : 'addFarmDesc')}</p>
        </div>
        <Card className="w-full">
        <CardHeader className="p-6">
            <CardTitle>{t('step')} {step}: {step === 1 ? t('farmDetails') : step === 2 ? t('location') : t('photos')}</CardTitle>
            <CardDescription>
                {step === 1 ? t('step1Desc') : step === 2 ? t('step2Desc') : t('step3Desc')}
            </CardDescription>
            <Progress value={progress} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="p-6">
            {isLoading ? (
                <div className="space-y-4 max-w-2xl mx-auto">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-1/4 mt-4" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-1/4 mt-4" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : (
                <>
                    {step === 1 && <Step1 formData={formData} handleChange={handleChange} />}
                    {step === 2 && <Step2 formData={formData} handleChange={handleChange} />}
                    {step === 3 && (
                      <Step3 
                        photos={photos} 
                        addPhotoUrl={addPhotoUrl} 
                        removePhoto={removePhoto} 
                      />
                    )}
                </>
            )}
        </CardContent>
        <CardFooter className="flex justify-between p-6">
            <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                <ChevronsLeft className="mr-2 h-4 w-4" />
                {t('back')}
            </Button>
            {step < totalSteps ? (
            <Button onClick={handleNext} disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}>
                {t('next')}
                <ChevronsRight className="ml-2 h-4 w-4" />
            </Button>
            ) : (
            <Button onClick={handleSubmit}>
                {farmId ? t('updateFarm') : t('submit')}
                <Send className="ml-2 h-4 w-4" />
            </Button>
            )}
        </CardFooter>
        </Card>
    </div>
  );
}

type Step1Props = {
    formData: {
        farmName: string;
        farmSize: string;
        mainCrops: string;
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function Step1({ formData, handleChange }: Step1Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="farmName">{t('farmName')}</Label>
        <Input id="farmName" placeholder={t('farmNamePlaceholder')} required value={formData.farmName} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="farmSize">{t('farmSizeAcres')}</Label>
        <Input id="farmSize" type="number" placeholder={t('farmSizePlaceholder')} required value={formData.farmSize} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mainCrops">{t('mainCrops')}</Label>
        <Textarea id="mainCrops" placeholder={t('mainCropsPlaceholder')} required value={formData.mainCrops} onChange={handleChange} />
      </div>
    </div>
  );
}

type Step2Props = {
    formData: {
        address: string;
    };
    handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function Step2({ formData, handleChange }: Step2Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
        <div className="space-y-2 max-w-2xl mx-auto">
            <Label htmlFor="address">{t('addressOrLocation')}</Label>
            <Textarea id="address" placeholder={t('addressPlaceholder')} required value={formData.address} onChange={handleChange} />
        </div>
        <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center mt-4">
            <div className="text-center text-muted-foreground p-4">
                <MapPin className="mx-auto h-8 w-8 mb-2" />
                <p>{t('mapViewAvailable')}</p>
                <p className="text-xs">({t('futureFeature')})</p>
            </div>
        </div>
    </div>
  );
}


type Step3Props = {
  photos: string[];
  addPhotoUrl: (url: string) => void;
  removePhoto: (index: number) => void;
};

function Step3({ photos, addPhotoUrl, removePhoto }: Step3Props) {
    const { t } = useTranslation();
    const [currentUrl, setCurrentUrl] = useState('');

    const handleAddClick = () => {
        addPhotoUrl(currentUrl);
        setCurrentUrl('');
    }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
        <div className="space-y-2">
            <Label htmlFor="photoUrl">{t('addPhotoUrl')}</Label>
            <div className="flex gap-2">
                 <Input 
                  id="photoUrl"
                  placeholder="https://example.com/image.jpg"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                />
                <Button type="button" onClick={handleAddClick} disabled={!currentUrl}>
                    <Plus className="mr-2 h-4 w-4" /> {t('add')}
                </Button>
            </div>
        </div>
        
        {photos.length > 0 &&
            <div className="space-y-2">
                <Label>{t('photoPreviews')}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square w-full overflow-hidden rounded-md border">
                            <Image src={photo} alt={`${t('farmPhoto')} ${index + 1}`} fill className="object-cover" unoptimized/>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-1 right-1 h-6 w-6 rounded-full"
                              onClick={() => removePhoto(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        }
    </div>
  );
}

    