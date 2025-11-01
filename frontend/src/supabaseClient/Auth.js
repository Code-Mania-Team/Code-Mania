import supabase from './database.js';

export const signInWithEmail = async (email) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // allows new signups
      emailRedirectTo: 'http://localhost:5173/', // redirect after clicking magic link
    },
  });

  if (error) {
    console.error('Error signing in with email:', error.message);
  } else {
    console.log('Magic link sent to:', email);
  }

  return { data, error };
};

export const checkSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};
