"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { GoogleLogo } from "@/components/icons/GoogleLogo";
import Link from 'next/link';
import { ChevronUpIcon, ChevronDownIcon, Eye, EyeOff } from "lucide-react";
import toast from 'react-hot-toast';

export function SignupForm({
  className,
  role = 'patient',
  ...props
}) {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    specialization: '', 
    fee: 500, 
    experience: 1,
    gender: ''
  });

  const specializations = [
    'Cardiologist', 'Dermatologist', 'Neurologist', 
    'Pediatrician', 'Psychiatrist', 'Orthopedic', 
    'General Physician', 'Gynecologist'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords don't match!");
    }
    
    setLoading(true);
    try {
      const res = await register({ ...form, role });
      
      if (res.error) {
        toast.error(res.error);
        return;
      }

      const user = res.user;
      toast.success('Account created successfully!');
      if (user.role === 'doctor') {
        toast('Your profile is pending admin approval.', { icon: '⏳' });
        router.push('/dashboard/doctor');
      } else {
        router.push('/dashboard/patient');
      }
    } catch (err) {
      console.error('SignupForm handleSubmit error:', err);
      toast.error(err.message || 'An unexpected error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-none bg-transparent shadow-none p-0 md:p-0 rounded-none">
        <CardHeader className="p-0 mb-8 md:mb-10 text-center">
          <CardTitle className="text-3xl md:text-[36px] font-black text-white leading-tight">
            Join as a {role.charAt(0).toUpperCase() + role.slice(1)}
          </CardTitle>
          <CardDescription className="text-zinc-500 text-base font-medium mt-2">
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-8">
              <Field>
                <FieldLabel htmlFor="name" className="text-white text-[14px] font-bold mb-2">Full Name</FieldLabel>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  value={form.name}
                  onChange={handleChange}
                  className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-zinc-600"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email" className="text-white text-[14px] font-bold mb-2">Email</FieldLabel>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={form.email}
                  onChange={handleChange}
                  className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-zinc-600"
                />
              </Field>

              {role === 'doctor' && (
                <>
                  <Field>
                    <FieldLabel className="text-white text-[14px] font-bold mb-2">Specialization</FieldLabel>
                    <Select 
                      onValueChange={(val) => setForm(prev => ({ ...prev, specialization: val }))}
                      required
                    >
                      <SelectTrigger className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl">
                        <SelectValue placeholder="Select Specialization" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/40 backdrop-blur-xl border-white/10 text-white min-w-[200px]">
                        {specializations.map(s => (
                          <SelectItem 
                            key={s} 
                            value={s}
                            className="focus:bg-white focus:text-black transition-colors duration-200 cursor-pointer rounded-lg mx-1 my-0.5"
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                  <FieldLabel className="text-white text-[14px] font-bold mb-2">Gender</FieldLabel>
                  <Select onValueChange={(val) => setForm(prev => ({ ...prev, gender: val }))}>
                    <SelectTrigger className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/40 backdrop-blur-xl border-white/10 text-white">
                      <SelectItem value="male" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Male</SelectItem>
                      <SelectItem value="female" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Female</SelectItem>
                      <SelectItem value="other" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-white text-[14px] font-bold mb-2">Gender</FieldLabel>
                  <Select onValueChange={(val) => setForm(prev => ({ ...prev, gender: val }))}>
                    <SelectTrigger className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/40 backdrop-blur-xl border-white/10 text-white">
                      <SelectItem value="male" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Male</SelectItem>
                      <SelectItem value="female" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Female</SelectItem>
                      <SelectItem value="other" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-white text-[14px] font-bold mb-2">Gender</FieldLabel>
                  <Select onValueChange={(val) => setForm(prev => ({ ...prev, gender: val }))}>
                    <SelectTrigger className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/40 backdrop-blur-xl border-white/10 text-white">
                      <SelectItem value="male" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Male</SelectItem>
                      <SelectItem value="female" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Female</SelectItem>
                      <SelectItem value="other" className="focus:bg-white focus:text-black transition-colors cursor-pointer rounded-lg mx-1 my-0.5">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="fee" className="text-white text-[14px] font-bold mb-2">Fee (₹)</FieldLabel>
                      <div className="relative group">
                        <Input 
                          id="fee" 
                          type="number" 
                          value={form.fee}
                          onChange={handleChange}
                          className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, fee: Number(prev.fee) + 100 }))}
                            className="p-0.5 hover:bg-white/10 rounded-t-md text-white/40 hover:text-white transition-colors"
                          >
                            <ChevronUpIcon className="w-3 h-3" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, fee: Math.max(0, Number(prev.fee) - 100) }))}
                            className="p-0.5 hover:bg-white/10 rounded-b-md text-white/40 hover:text-white transition-colors"
                          >
                            <ChevronDownIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="experience" className="text-white text-[14px] font-bold mb-2">Exp (yrs)</FieldLabel>
                      <div className="relative group">
                        <Input 
                          id="experience" 
                          type="number" 
                          value={form.experience}
                          onChange={handleChange}
                          className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, experience: Number(prev.experience) + 1 }))}
                            className="p-0.5 hover:bg-white/10 rounded-t-md text-white/40 hover:text-white transition-colors"
                          >
                            <ChevronUpIcon className="w-3 h-3" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, experience: Math.max(0, Number(prev.experience) - 1) }))}
                            className="p-0.5 hover:bg-white/10 rounded-b-md text-white/40 hover:text-white transition-colors"
                          >
                            <ChevronDownIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </Field>
                  </div>

                  {/* Bio Removed */}
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel htmlFor="password" title="Password" className="text-white text-[14px] font-bold mb-2">Password</FieldLabel>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={form.password}
                      onChange={handleChange}
                      className="bg-white/[0.03] border-white/5 text-white h-12 px-4 pr-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldDescription className="text-zinc-600 text-[12px] mt-1.5">Min 8 chars</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword" title="Confirm Password" className="text-white text-[14px] font-bold mb-2">Confirm</FieldLabel>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    required 
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="bg-white/[0.03] border-white/5 text-white h-12 px-4 rounded-xl focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-zinc-600"
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <Button type="submit" className="w-full bg-white hover:bg-zinc-200 text-black h-12 font-bold rounded-full transition-all active:scale-[0.98] shadow-xl" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
                
                <button 
                  type="button" 
                  className="w-full h-12 flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] text-white font-bold transition-all duration-300 hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-[0.98]"
                  onClick={() => {
                    signIn('google', { callbackUrl: `/dashboard/${role}` });
                  }}
                >
                  <GoogleLogo className="w-5 h-5 transition-colors group-hover:text-black" />
                  Sign up with Google
                </button>

                <div className="text-center text-[15px] mt-4">
                  <span className="text-zinc-500">Already have an account? </span>
                  <Link href="/login" className="text-white hover:text-blue-400 font-bold transition-colors">Sign in</Link>
                </div>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
