"use client"

import React, {useEffect, useState} from 'react'
import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'
import Image from 'next/image'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const Loginpage = () => {

const { user, isLoaded } = useUser(); // Ensure user data is fully loaded
const { signOut } = useAuth(); // Allow manual sign-out if needed
const router = useRouter();
const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!isLoaded) return;

        const role = user?.publicMetadata.role;

        // Only handle unauthorized users here, let middleware handle routing
        if (role && role !== "admin") {
        setErrorMessage("You are not authorized to access this application.");
        signOut();
        }
    }, [user, isLoaded, router, signOut]);

return (
    <div className=" w-screen h-screen bg-[#e6f0f8] overflow-hidden">
    <div className='flex items-center justify-center w-screen'>
    <SignIn.Root>
        <SignIn.Step name='start' className='z-20 md:mt-40 max-sm:mt-52 relative isolate w-[95vw] space-y-8 rounded-2xl bg-[#4b85ac] px-4 py-10 shadow-md before:absolute before:inset-0 before:-z-10 before:rounded-2xl sm:w-96 sm:px-8'>
        <header className="text-center flex items-center justify-center">
            <div className="">
            <Image src="/logosch.png" alt="schoolLogo" width={60} height={60} className="" />
            </div>
            <h1 className=" md:text-base text-sm font-medium tracking-tight text-white">
            Sign-In to NewLight Academy Payroll
            </h1>
        </header>
        <Clerk.GlobalError className="block text-sm text-rose-400" />
        <Clerk.Field name="identifier" className="group/field relative">
            <Clerk.Label className="absolute left-2 top-0 -translate-y-1/2 bg-emerald-950 px-2 font-mono text-xs/4 text-white before:absolute before:inset-0 before:-z-10 before:bg-black/50 group-focus-within/field:text-emerald-300 group-data-[invalid]/field:text-rose-400">
            Email / Username
            </Clerk.Label>
            <Clerk.Input
            type="text"
            required
            className="w-full rounded-lg bg-[#f4f7fb] px-4 py-2.5 text-sm text-black outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-emerald-300 data-[invalid]:shadow-rose-400/20 data-[invalid]:ring-rose-400"
            />
            <Clerk.FieldError className="mt-2 block text-xs text-rose-400" />
        </Clerk.Field>
        <Clerk.Field name="password" className="group/field relative">
            <Clerk.Label className="absolute left-2 top-0 -translate-y-1/2 bg-emerald-950 px-2 font-mono text-xs/4 text-white before:absolute before:inset-0 before:-z-10 before:bg-black/50 group-focus-within/field:text-emerald-300 group-data-[invalid]/field:text-rose-400">
            Password
            </Clerk.Label>
            <Clerk.Input
            type="password"
            required
            className="w-full rounded-lg bg-[#f4f7fb] px-4 py-2.5 text-sm text-black outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-emerald-300 data-[invalid]:shadow-rose-400/20 data-[invalid]:ring-rose-400"
            />
            <Clerk.FieldError className="mt-2 block text-xs text-rose-400" />
        </Clerk.Field>
        {errorMessage && <p className="text-rose-400 text-center">{errorMessage}</p>}
        <SignIn.Action
            submit
            className="relative isolate w-full rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-500 px-3.5 py-2.5 text-center text-sm font-medium text-emerald-950 shadow-[0_1px_0_0_theme(colors.white/30%)_inset,0_-1px_1px_0_theme(colors.black/5%)_inset] outline-none before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-white/10 before:opacity-0 hover:before:opacity-100 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-white active:text-emerald-950/80 active:before:bg-black/10"
        >
            Sign In
        </SignIn.Action>
        </SignIn.Step>
    </SignIn.Root>
    </div>
<div className='absolute bottom-0 w-full z-10'>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path fill="#2772a0" 
        fillOpacity={1} 
        d="M0,96L14.1,90.7C28.2,85,56,75,85,96C112.9,117,141,171,169,197.3C197.6,224,226,224,254,208C282.4,192,311,160,339,133.3C367.1,107,395,85,424,74.7C451.8,64,480,
        64,508,74.7C536.5,85,565,107,593,133.3C621.2,160,649,192,678,197.3C705.9,203,734,181,762,160C790.6,139,819,117,847,122.7C875.3,128,904,160,932,149.3C960,139,
        988,85,1016,69.3C1044.7,53,1073,75,1101,101.3C1129.4,128,1158,160,1186,170.7C1214.1,181,1242,171,1271,170.7C1298.8,171,1327,181,1355,165.3C1383.5,149,1412,
        107,1426,85.3L1440,64L1440,320L1425.9,320C1411.8,320,1384,320,1355,320C1327.1,320,1299,320,1271,320C1242.4,320,1214,320,1186,320C1157.6,320,1129,320,1101,
        320C1072.9,320,1045,320,1016,320C988.2,320,960,320,932,320C903.5,320,875,320,847,320C818.8,320,791,320,762,320C734.1,320,706,320,678,320C649.4,320,621,320,
        593,320C564.7,320,536,320,508,320C480,320,452,320,424,320C395.3,
        320,367,320,339,320C310.6,320,282,320,254,320C225.9,320,198,320,169,320C141.2,320,113,320,85,320C56.5,320,28,320,14,320L0,320Z">
        </path>
    </svg>
    </div>
</div>
)
}

export default Loginpage