"use client";
import React, { useState, Suspense } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle, IconBrandOnlyfans } from "@tabler/icons-react";
import { LabelInputContainer, BottomGradient } from "@/components/ui/aceternity/form-utils";
import { BackgroundBeams } from "@/components/ui/aceternity/background-beams";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectRole = searchParams.get('role') || 'buyer';

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate login delay
        setTimeout(() => {
            console.log("Form submitted");
            router.push(`/dashboard/${redirectRole}`);
        }, 1500);
    };

    return (
        <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 relative z-10">
            <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
                Welcome to Morera Ventures
            </h2>
            <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
                Login to access your {redirectRole} dashboard
            </p>

            <form className="my-8" onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                    <LabelInputContainer>
                        <Label htmlFor="firstname">First name</Label>
                        <Input id="firstname" placeholder="Tyler" type="text" />
                    </LabelInputContainer>
                    <LabelInputContainer>
                        <Label htmlFor="lastname">Last name</Label>
                        <Input id="lastname" placeholder="Durden" type="text" />
                    </LabelInputContainer>
                </div>
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" placeholder="projectmayhem@fc.com" type="email" />
                </LabelInputContainer>
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" placeholder="••••••••" type="password" />
                </LabelInputContainer>
                <LabelInputContainer className="mb-8">
                    <Label htmlFor="twitterpassword">Your twitter password</Label>
                    <Input
                        id="twitterpassword"
                        placeholder="••••••••"
                        type="twitterpassword"
                    />
                </LabelInputContainer>

                <button
                    className="bg-gradient-to-br from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] relative group/btn"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            Signing in...
                        </div>
                    ) : (
                        <>
                            Sign up &rarr;
                            <BottomGradient />
                        </>
                    )}
                </button>

                <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

                <div className="flex flex-col space-y-4">
                    <button
                        className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                        type="button"
                        onClick={() => router.push(`/dashboard/${redirectRole}`)}
                    >
                        <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                        <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                            GitHub
                        </span>
                        <BottomGradient />
                    </button>
                    <button
                        className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                        type="button"
                        onClick={() => router.push(`/dashboard/${redirectRole}`)}
                    >
                        <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                        <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                            Google
                        </span>
                        <BottomGradient />
                    </button>
                </div>
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
