import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const { signInEmail, signUpEmail, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password, name || undefined);
      }
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
      </button>
      <p className="text-sm text-gray-600 text-center">
        {mode === 'login' ? (
          <button type="button" onClick={() => setMode('signup')} className="text-green-700 font-medium">Create an account</button>
        ) : (
          <button type="button" onClick={() => setMode('login')} className="text-green-700 font-medium">Have an account? Log in</button>
        )}
      </p>
    </form>
  );
}


