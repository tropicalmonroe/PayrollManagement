// import React from 'react'
// import { MdMessage } from "react-icons/md";
// import { GrAnnounce } from "react-icons/gr";
// import { UserButton } from '@clerk/nextjs';
// import { currentUser } from '@clerk/nextjs/server';
// import { redirect } from 'next/navigation';

// const Navbar = async () => {

//         const user = await currentUser();

//         if (!user) {
//             redirect('/sign-in');
//         }

// return (
//     <div className=' flex items-center justify-between bg-[#f49675] h-[8vh]'>
//         {/* other icons */}
//         <div className='p-2 flex items-center gap-4 justify-end w-full'>
//             <div className='bg-orange-100 rounded-sm items-center justify-center flex p-2 cursor-pointer'>
//                 <MdMessage className='text-lg text-zinc-800 font-semibold'/>
//             </div>
//             <div className='bg-orange-100 rounded-sm items-center justify-center flex p-2 cursor-pointer relative'>
//                 <GrAnnounce className='text-lg text-zinc-800 font-semibold'/>
//                 <div className='absolute -top-2 -right-2 bg-zinc-800 rounded-full w-5 h-5 flex items-center justify-center text-xs'><span className='font-semibold text-[#eee]'>4</span></div>
//             </div>
//             <div className='rounded-sm items-center justify-between gap-2 flex p-[1px] cursor-pointer'>
//                 <div className='flex flex-col'>
//                     <p className='font-semibold text-xs capitalize tracking-tighter mb-[1px] text-[#f1f8f3]'>{user?.firstName} {user?.lastName}</p>
//                     <div className=' rounded-sm bg-orange-100 flex items-center justify-center lg:w-[4vw] md:w-[6vw] w-[10vw]'>
//                     <p className='font-semibold text-center text-xs capitalize tracking-tighter text-zinc-800'>{user?.publicMetadata.role as string}</p>
//                     </div>
//                 </div>
//                 <div className='rounded-full object-cover scale-125 mt-3 ml-1'>
//                     {/* <Image src="/navimage.jpg" alt="nav image" width={35} height={35} className='rounded-full object-cover' /> */}
//                     <UserButton />
//                 </div>
//             </div>
//             <div>
//             </div>
//         </div>
//     </div>
// )
// }

// export default Navbar