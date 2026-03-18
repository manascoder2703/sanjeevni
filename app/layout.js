import { Geist } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

const geist = Geist({ subsets: ['latin'] });

export const metadata = {
  title: 'Sanjeevni — Your Health, One Click Away',
  description: 'Book doctor appointments and consult online via video call.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <TooltipProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'neural-toast',
              success: { className: 'neural-toast neural-toast-success' },
              error: { className: 'neural-toast neural-toast-error' },
              duration: 4000
            }}
          />
          <ClientProviders>
            {children}
          </ClientProviders>
        </TooltipProvider>
      </body>
    </html>
  );
}
