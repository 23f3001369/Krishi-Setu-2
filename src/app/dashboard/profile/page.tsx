
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Phone, Shield, Tractor, Sprout, MapPin, AreaChart, Edit, PlusCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, getDoc, collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';


const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  mobile: z.string().optional(),
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(6, 'Password must be at least 6 characters.'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters.'),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

type Farm = {
    id: string;
    name: string;
    size: number;
    location: string;
    mainCrops: string[];
};

function RegisteredFarmsCard() {
    const { user } = useUser();
    const db = useFirestore();
    const { t } = useTranslation();

    const farmsQuery = useMemoFirebase(() => {
        if (!db || !user?.uid) return null;
        return query(collection(db, 'farms'), where('farmerId', '==', user.uid));
    }, [db, user?.uid]);

    const { data: farms, isLoading } = useCollection<Farm>(farmsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Tractor className="w-5 h-5 text-primary" />
                    {t('registeredFarms')}
                </CardTitle>
                <CardDescription>{t('registeredFarmsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
                {isLoading ? (
                    <>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </>
                ) : farms && farms.length > 0 ? (
                    farms.map((farm, index) => (
                       <React.Fragment key={farm.id}>
                         {index > 0 && <Separator />}
                         <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">{farm.name}</h3>
                                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{farm.location}</p>
                                    <p className="flex items-center gap-2"><AreaChart className="w-4 h-4" />{farm.size} {t('acres')}</p>
                                    <p className="flex items-center gap-2"><Sprout className="w-4 h-4" />{farm.mainCrops.join(', ')}</p>
                                </div>
                            </div>
                             <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/farm-registration?id=${farm.id}`}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    {t('edit')}
                                </Link>
                            </Button>
                        </div>
                       </React.Fragment>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        <p>{t('noFarmsRegistered')}</p>
                         <Button variant="secondary" className="mt-4" asChild>
                            <Link href="/dashboard/farm-registration">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t('registerAFarm')}
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
            {farms && farms.length > 0 && (
                 <CardFooter className="p-6 border-t">
                    <Button variant="secondary" asChild>
                        <Link href="/dashboard/farm-registration">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('registerAnotherFarm')}
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}


export default function ProfilePage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const { user, isUserLoading: isAuthUserLoading } = useUser();
  const db = useFirestore();


  const farmerDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'farmers', user.uid);
  }, [db, user?.uid]);
  
  const isUserLoading = isAuthUserLoading;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', email: '', mobile: '' },
    mode: 'onChange',
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    },
    mode: 'onChange',
  });
  
  useEffect(() => {
    if (user && db && farmerDocRef) {
      const fetchFarmerData = async () => {
        const docSnap = await getDoc(farmerDocRef);
        if (docSnap.exists()) {
          const farmerData = docSnap.data();
          profileForm.reset({
            name: user.displayName || farmerData.name || '',
            email: user.email || farmerData.email || '',
            mobile: farmerData.phone || '',
          });
        } else {
            profileForm.reset({
                name: user.displayName || '',
                email: user.email || '',
                mobile: user.phoneNumber || '', 
            });
        }
      };
      fetchFarmerData();
    }
  }, [user, db, farmerDocRef, profileForm]);


  async function onProfileSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    console.log(data);
    // TODO: Implement logic to update user profile in Firebase Auth
    // (e.g., updateProfile(auth.currentUser, { displayName: data.name }))
    // and in Firestore.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: t('profileUpdated'),
      description: t('profileUpdatedDesc'),
    });
    setIsLoading(false);
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsPasswordLoading(true);
    console.log(data);
    // TODO: Implement Firebase password change logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: t('passwordChanged'),
      description: t('passwordChangedDesc'),
    });
    passwordForm.reset();
    setIsPasswordLoading(false);
  }

  return (
    <>
        <div className="space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                {t('myProfile')}
                </h1>
                <p className="text-muted-foreground">
                    {t('myProfileDesc')}
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 grid gap-8">
                    <Card>
                        <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                            <CardHeader>
                                <CardTitle>{t('accountInformation')}</CardTitle>
                                <CardDescription>{t('accountInformationDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/avatar/200/200"} alt={user?.displayName || "Farmer"} />
                                            <AvatarFallback>{user?.displayName?.charAt(0) || 'F'}</AvatarFallback>
                                        </Avatar>
                                        <Button size="icon" variant="outline" className="absolute bottom-0 right-0 rounded-full h-7 w-7">
                                            <Camera className="h-4 w-4" />
                                            <span className="sr-only">{t('changePhoto')}</span>
                                        </Button>
                                    </div>
                                    {isUserLoading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-32" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                    ) : (
                                        <div>
                                            <h2 className="text-xl font-semibold">{profileForm.watch('name') || t('noName')}</h2>
                                            <p className="text-sm text-muted-foreground">{profileForm.watch('email')}</p>
                                        </div>
                                    )}
                                </div>
                                <FormField
                                    control={profileForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('fullName')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('yourName')} {...field} disabled={isUserLoading} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={profileForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('emailAddress')}</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="your.email@example.com" {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={profileForm.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('mobileNumber')}</FormLabel>
                                        <FormControl>
                                        <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder={t('yourMobileNumber')} {...field} className="pl-9" disabled={isUserLoading}/>
                                        </div>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                            </CardContent>
                            <CardFooter className="p-6">
                                <Button type="submit" disabled={isLoading || isUserLoading}>
                                    {isLoading ? t('saving') : t('saveChanges')}
                                </Button>
                            </CardFooter>
                        </form>
                        </Form>
                    </Card>

                    <Card>
                        <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    {t('security')}
                                </CardTitle>
                                <CardDescription>{t('securityDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('currentPassword')}</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('newPassword')}</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{t('confirmNewPassword')}</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                            </CardContent>
                            <CardFooter className="p-6">
                                <Button type="submit" disabled={isPasswordLoading}>
                                    {isPasswordLoading ? t('updating') : t('changePassword')}
                                </Button>
                            </CardFooter>
                        </form>
                        </Form>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <RegisteredFarmsCard />
                </div>
            </div>
        </div>
    </>
  );
}
