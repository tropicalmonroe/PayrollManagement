import React from 'react'
import { TbTrendingUp } from "react-icons/tb";

export default function ReportsPage() {
return (
    <>
        <div className="space-y-6">
        <div className='mt-[2vh]'>
            <h2 className="text-2xl font-bold text-zinc-50 tracking-tighter">Reports and Documents</h2>
            <p className="mt-1 text-sm text-[#e6f0f8]">
            View payroll reports and manage documents
            </p>
        </div>

        <div className="bg-white shadow rounded-lg h-[74vh]">
            <div className="px-4 py-5 sm:p-6 flex flex-col justify-center items-center">
            <div className="text-center py-12">
                <div className='flex justify-center items-center'>
                <div className='flex justify-center items-center w-20 h-20 bg-[#c7e0f0] rounded-2xl'>
                <span className="text-6xl text-[#1f4f6d] text-center">
                    <TbTrendingUp />
                    </span>
                </div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-zinc-900 tracking-tight">No reports available</h3>
                <p className="mt-2 text-sm text-zinc-500 tracking-tight capitalize">
                Reports will be available after payroll calculations
                </p>
            </div>
            </div>
        </div>
        </div>
    </>
)
}