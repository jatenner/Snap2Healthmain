import { redirect } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function HomePage() {
  // Redirect to upload page as the main entry point
  redirect('/upload');
} 