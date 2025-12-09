"use client";
import React, { useState, Suspense, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { LabelInputContainer, BottomGradient } from "@/components/ui/aceternity/form-utils";
import { BackgroundBeams } from "@/components/ui/aceternity/background-beams";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectRole = searchParams.get('role') || 'buyer';
    const { signUp, signIn, user, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // Block seller signup - sellers can only be created by admin
    const isSellerRole = redirectRole === 'seller';
    const canSignUp = !isSellerRole; // Sellers cannot sign up themselves

    // Redirect if already logged in
    useEffect(() => {
        if (user && !authLoading) {
            console.log('User logged in, redirecting to:', `/dashboard/${user.role}`);
            router.replace(`/dashboard/${user.role}`);
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // Completely block seller signup - sellers can only be created by admin
                if (isSellerRole) {
                    setError('Seller accounts can only be created by administrators. Please contact your admin for access.');
                    setIsLoading(false);
                    return;
                }

                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setIsLoading(false);
                    return;
                }
                const { error } = await signUp(
                    formData.email,
                    formData.password,
                    `${formData.firstName} ${formData.lastName}`,
                    redirectRole as 'buyer' | 'seller' | 'admin'
                );
                if (error) {
                    setError(error.message || 'Failed to sign up');
                } else {
                    router.push(`/dashboard/${redirectRole}`);
                }
            } else {
                const { error } = await signIn(formData.email, formData.password);
                if (error) {
                    setError(error.message || 'Failed to sign in');
                } else {
                    // Redirect will happen via useEffect when user is set
                    console.log('Sign in successful, waiting for redirect...');
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 relative z-10">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-neutral-200"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 relative z-10">
            <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
                Welcome to Morera Ventures
            </h2>
            <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
                {isSellerRole 
                    ? 'Login to access your seller dashboard' 
                    : (isSignUp ? `Sign up to access your ${redirectRole} dashboard` : `Login to access your ${redirectRole} dashboard`)
                }
            </p>

            {/* Show info message for sellers about signup restriction */}
            {isSellerRole && !isSignUp && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        Seller accounts are created by administrators only. If you don&apos;t have an account, please contact your admin.
                    </p>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <form className="my-8" onSubmit={handleSubmit}>
                {isSignUp && (
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                        <LabelInputContainer>
                            <Label htmlFor="firstname">First name</Label>
                            <Input
                                id="firstname"
                                placeholder="John"
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </LabelInputContainer>
                        <LabelInputContainer>
                            <Label htmlFor="lastname">Last name</Label>
                            <Input
                                id="lastname"
                                placeholder="Doe"
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </LabelInputContainer>
                    </div>
                )}
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        placeholder="you@example.com"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </LabelInputContainer>
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        placeholder="••••••••"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </LabelInputContainer>
                {isSignUp && (
                    <LabelInputContainer className="mb-8">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            placeholder="••••••••"
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </LabelInputContainer>
                )}

                <button
                    className="bg-gradient-to-br from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] relative group/btn"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            {isSignUp ? 'Signing up...' : 'Signing in...'}
                        </div>
                    ) : (
                        <>
                            {isSignUp ? 'Sign up' : 'Sign in'} &rarr;
                            <BottomGradient />
                        </>
                    )}
                </button>

                {/* Only show signup toggle for non-seller roles */}
                {canSignUp && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setFormData({
                                    firstName: '',
                                    lastName: '',
                                    email: '',
                                    password: '',
                                    confirmPassword: '',
                                });
                            }}
                            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default function AuthPage() {
    return (
        <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
            <BackgroundBeams className="opacity-40" />
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <AuthForm />
            </Suspense>
        </div>
    );
}
