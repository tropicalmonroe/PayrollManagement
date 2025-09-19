// "use client";

// import { useUser, SignOutButton } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import { Avatar, AvatarFallback } from '../components/ui/avatar';
// import {
// DropdownMenu,
// DropdownMenuTrigger,
// DropdownMenuContent,
// DropdownMenuLabel,
// DropdownMenuSeparator,
// DropdownMenuItem,
// } from '../components/ui/dropdown-menu';
// import { ChevronDown, User, LogOut, Circle } from 'lucide-react';

// interface SidebarFooterProps {
// collapsed?: boolean;
// }

// export default function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
// const router = useRouter();
// const { user } = useUser();

// const getInitials = (user: any) => {
//     const first = (user?.firstName ?? "").charAt(0);
//     const last = (user?.lastName ?? "").charAt(0);
//     return `${first}${last}`;
// };

// const role: string = typeof user?.publicMetadata?.role === "string" ? user.publicMetadata.role : "Administrator";

// return (
//     <div className="px-4 py-4 border-t border-zinc-100 bg-white">
//     <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//         <div
//             className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"} cursor-pointer p-2 rounded-md hover:bg-zinc-50 transition-colors duration-150`}
//         >
//             <Avatar className="h-12 w-12 border border-zinc-200 overflow-hidden">
//             <AvatarFallback className="bg-[#0063b4] text-white text-sm font-medium">
//                 {user ? getInitials(user) : "TA"}
//             </AvatarFallback>
//             </Avatar>

//             {!collapsed && (
//             <>
//                 <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium text-zinc-900 truncate">
//                     {user ? `${user.firstName ?? ""} ${user.lastName ?? ""}` : "AD Capital Admin"}
//                 </p>
//                 <p className="text-xs text-zinc-500 truncate">
//                     {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
//                 </p>
//                 </div>
//                 <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />
//             </>
//             )}
//         </div>
//         </DropdownMenuTrigger>

//         <DropdownMenuContent align="end" className="w-48 bg-white mb-[2vh] -mr-[1vw]">
//         <DropdownMenuLabel className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
//             My Account
//         </DropdownMenuLabel>
//         <DropdownMenuSeparator />
//         <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => router.push("/profile")}>
//             <User className="mr-3 h-4 w-4" />
//             <span>Profile Settings</span>
//         </DropdownMenuItem>
//         <DropdownMenuSeparator />
//         <DropdownMenuItem className="cursor-pointer text-sm text-rose-400 hover:text-rose-700 hover:bg-rose-50">
//             <SignOutButton>
//             <div className="flex items-center">
//                 <LogOut className="mr-3 h-4 w-4" />
//                 <span>Log Out</span>
//             </div>
//             </SignOutButton>
//         </DropdownMenuItem>
//         </DropdownMenuContent>
//     </DropdownMenu>

//     <div className="flex items-center justify-center mt-3 pt-3 border-t border-zinc-100">
//         <div className={`flex items-center ${collapsed ? "justify-center" : "space-x-2"}`}>
//         <Circle className="w-2 h-2 text-green-500 fill-current" />
//         {!collapsed && <p className="text-xs text-zinc-500 font-medium">© 2025 NewLight Academy</p>}
//         </div>
//     </div>
//     </div>
// );
// }
