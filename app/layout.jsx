import './globals.css'
import ClientAuthProvider from '../components/ClientAuthProvider'

export const metadata = {
  title: 'AI For Social Impact : AI Youth Directors',
  description: 'Create AI-generated animated movies about Sustainable Development Goals',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler to prevent crashes
              window.addEventListener('error', function(e) {
                console.error('Global error caught:', e.error);
                e.preventDefault();
                return true;
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
                e.preventDefault();
                return true;
              });
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        <ClientAuthProvider>
          {children}
        </ClientAuthProvider>
      </body>
    </html>
  )
}

