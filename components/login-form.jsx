"use client";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { GoogleLogo } from "@/components/icons/GoogleLogo";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import OTPModal from '@/components/OTPModal';

export function LoginForm({ className, ...props }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, pendingOTP } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);

      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.otpRequired) {
        // OTPModal will appear automatically via pendingOTP in AuthContext
        return;
      }

      const user = res.user;
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') router.push('/admin');
      else router.push(`/dashboard/${user.role}`);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (user) => {
    toast.success(`Welcome back, ${user.name}!`);
    if (user.role === 'admin') router.push('/admin');
    else router.push(`/dashboard/${user.role}`);
  };

  return (
    <>
      {/* OTP modal appears over everything when pendingOTP is set */}
      {pendingOTP && <OTPModal onSuccess={handleOTPSuccess} />}

      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="border-none bg-transparent shadow-none p-0 md:p-0 rounded-none">
          <CardHeader className="p-0 mb-8 md:mb-10 text-center">
            <CardTitle className="text-3xl md:text-[36px] font-black text-white leading-tight">Welcome Back</CardTitle>
            <CardDescription className="text-zinc-500 text-base font-medium mt-2">
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="email" className="text-white text-[14px] font-bold mb-2">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                    required
                    className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <FieldLabel htmlFor="password" className="text-white text-[14px] font-bold">Password</FieldLabel>
                    <Link href="/forgot-password" className="text-[14px] text-zinc-500 hover:text-white transition-colors font-medium">
                      Forgot your password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                      required
                      className="bg-white/[0.03] border-white/5 text-white h-12 px-4 pr-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-[13px] font-medium text-rose-400 mt-2 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]">
                          <span className="inline-block w-1 h-1 rounded-full bg-rose-400" />
                          {error}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4 mt-4">
                  <Button type="submit" className="w-full bg-white hover:bg-zinc-200 text-black h-12 font-bold rounded-full transition-all active:scale-[0.98] shadow-xl" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                  <button
                    type="button"
                    className="w-full h-12 flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] text-white font-bold transition-all duration-300 hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-[0.98]"
                    onClick={() => signIn('google', { callbackUrl: '/dashboard/patient' })}
                  >
                    <GoogleLogo className="w-5 h-5 transition-colors group-hover:text-black" />
                    Login with Google
                  </button>
                </div>

                <div className="text-center text-[15px] mt-4">
                  <span className="text-zinc-500">Don't have an account? </span>
                  <Link href="/signup" className="text-white hover:text-blue-400 font-bold transition-colors">Sign up</Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}