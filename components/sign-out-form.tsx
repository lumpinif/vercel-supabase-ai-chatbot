import Form from 'next/form';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const SignOutForm = () => {
  const router = useRouter();
  const supabase = createClient();

  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';
        const { error } = await supabase.auth.signOut();
        if (!error) {
          router.push('/login');
          router.refresh();
        }
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  );
};
