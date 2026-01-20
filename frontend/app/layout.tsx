import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  title: 'AI-ассистент Цветов.ру — подбор букета за 2 минуты',
  description: 'Умный помощник для выбора цветов. Расскажите, кому и по какому поводу нужен букет — AI подберёт лучшие варианты с доставкой в вашем городе.',
  keywords: ['букет цветов', 'доставка цветов', 'заказать цветы', 'AI ассистент', 'подбор букета', 'Цветов.ру'],
  authors: [{ name: 'Цветов.ру' }],
  creator: 'Цветов.ру',
  publisher: 'Цветов.ру',
  metadataBase: new URL('https://ai.cvetov.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://ai.cvetov.com',
    siteName: 'AI-ассистент Цветов.ру',
    title: 'AI-ассистент Цветов.ру — подбор букета за 2 минуты',
    description: 'Умный помощник для выбора цветов. Расскажите, кому и по какому поводу нужен букет — AI подберёт лучшие варианты.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI-ассистент Цветов.ру',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-ассистент Цветов.ру — подбор букета за 2 минуты',
    description: 'Умный помощник для выбора цветов. AI подберёт лучшие варианты с доставкой.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    yandex: 'b738877f7df76860',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        {/* Telegram Web App */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        {/* MAX Web App */}
        <script src="https://st.max.ru/js/max-web-app.js"></script>
      </head>
      <body className={inter.className}>
        {/* Structured Data (JSON-LD) для поисковиков */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'AI-ассистент Цветов.ру',
              description: 'Умный помощник для выбора и заказа цветов с доставкой',
              url: 'https://ai.cvetov.com',
              applicationCategory: 'ShoppingApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'RUB',
              },
              author: {
                '@type': 'Organization',
                name: 'Цветов.ру',
                url: 'https://cvetov.com',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '1250',
              },
            }),
          }}
        />
        {children}

        {/* Яндекс.Метрика счётчик 98635933 */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(98635933, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true,
              trackHash:true
            });
          `}
        </Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/98635933" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
      </body>
    </html>
  )
}
