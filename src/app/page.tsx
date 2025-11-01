
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/logo';
import { Leaf, Shield } from 'lucide-react';
import Image from 'next/image';
import {PlaceHolderImages} from '@/lib/placeholder-images';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSelector } from '@/components/shared/language-selector';
import { useTranslation } from '@/hooks/use-translation';

export default function Home() {
  const { t } = useTranslation();
  const heroImage = PlaceHolderImages.find(p => p.id === "hero-image");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-10">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
          <span className="sr-only">Krishi Setu</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Button asChild variant="ghost">
            <Link href="/login" className="flex items-center gap-2" prefetch={false}>
              <Leaf className="h-4 w-4" />
              {t('farmerLogin')}
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/login" className="flex items-center gap-2" prefetch={false}>
              <Shield className="h-4 w-4" />
              {t('adminLogin')}
            </Link>
          </Button>
          <LanguageSelector />
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-16 md:pt-24 lg:pt-32">
          <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline">
                  {t('welcomeTo')} <span className="text-primary">Krishi Setu</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                  {t('heroSubtitle')}
                </p>
                <div className="space-x-4 mt-6">
                  <Button asChild size="lg">
                    <Link href="/signup" prefetch={false}>
                      {t('getStarted')}
                    </Link>
                  </Button>
                </div>
              </div>
               {heroImage && (
                 <div className="relative aspect-video overflow-hidden rounded-xl">
                    <Image
                      src={heroImage.imageUrl}
                      alt={heroImage.description}
                      data-ai-hint={heroImage.imageHint}
                      fill
                      className="object-cover"
                    />
                 </div>
               )}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">{t('ourFeatures')}</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">{t('featuresTitle')}</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t('featuresSubtitle')}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <div className="grid gap-1 text-center p-6 rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold">{t('feature1Title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('feature1Desc')}
                </p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold">{t('feature2Title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('feature2Desc')}
                </p>
              </div>
              <div className="grid gap-1 text-center p-6 rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold">{t('feature3Title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('feature3Desc')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2025 Krishi Setu. {t('allRightsReserved')}</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            {t('termsOfService')}
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            {t('privacy')}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
