import { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Admin Login | Magic Pages',
  description: 'Login to access the admin panel',
};

export default function LoginPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your admin credentials below
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
