'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
BarChart2,
FileText,
Calendar,
Settings,
ChevronDown,
ChevronRight,
Home,
Circle,
User,
Users,
LogOut,
ChevronLeft,
Menu,
Calculator,
DollarSign,
FileSpreadsheet,
CreditCard,
TrendingUp,
FileCheck,
Award,
Receipt,
LucideProps,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuLabel,
DropdownMenuSeparator,
DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
// import SidebarFooter from './SidebarFooter';

type SidebarItemProps = {
href: string;
icon: React.ReactNode;
title: string;
isActive: boolean;
hasChildren?: boolean;
isOpen?: boolean;
onClick?: () => void;
shortcut?: string;
collapsed?: boolean;
toggleSidebar?: () => void;
};

const SidebarItem: React.FC<SidebarItemProps> = ({
href,
icon,
title,
isActive,
hasChildren = false,
isOpen = false,
onClick,
shortcut,
collapsed = false,
toggleSidebar,
}) => {
const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && onClick) {
    e.preventDefault();
    if (collapsed && toggleSidebar) {
        toggleSidebar();
        setTimeout(() => {
        onClick();
        }, 400);
    } else {
        onClick();
    }
    }
};

const content = (
    <div
    className={`group relative flex items-center ${collapsed ? 'px-3' : 'px-6'} py-3 cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isActive ? 'bg-[#0063b4]/8 text-zinc-900 border-r-3 border-[#0063b4]' : 'hover:bg-zinc-50 text-zinc-700'
    }`}
    onClick={handleClick}
    >
    <div
        className={`${collapsed ? 'mx-auto' : 'mr-4'} transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isActive ? 'text-[#0063b4]' : 'text-zinc-100 group-hover:text-[#0063b4]'
        }`}
    >
        {React.cloneElement(icon as React.ReactElement<LucideProps>, {
        size: collapsed ? 20 : 18,
        strokeWidth: 1.5,
        })}
    </div>
    {!collapsed && (
        <span
        className={`flex-1 font-normal text-sm leading-tight ${
            isActive ? 'text-zinc-900 tracking-tight font-medium' : 'text-zinc-100 tracking-tight group-hover:text-zinc-900'
        }`}
        >
        {title}
        </span>
    )}
    {shortcut && !collapsed && (
        <div className="mr-2 px-1.5 py-0.5 rounded text-xs scale-90 bg-zinc-100 text-zinc-500 font-medium">{shortcut}</div>
    )}
    {hasChildren && !collapsed && (
        <div className={`ml-2 transition-all duration-200 ${isActive ? 'text-[#0063b4]' : 'text-zinc-100 group-hover:text-zinc-600'}`}>
        <ChevronRight size={14} strokeWidth={2} className={`transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
        </div>
    )}
    </div>
);

if (hasChildren) {
    return content;
}

return <Link href={href}>{content}</Link>;
};

type SidebarSubmenuProps = {
items: {
    href: string;
    title: string;
    shortcut?: string;
}[];
isOpen: boolean;
};

const SidebarSubmenu: React.FC<SidebarSubmenuProps> = ({ items, isOpen }) => {
const pathname = usePathname();

return (
    <div
    className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
    >
    <div className="bg-[#142b3d] border-l-1 border-slate-100 ml-6">
        {items.map((item) => (
        <Link key={item.href} href={item.href}>
            <div
            className={`group flex items-center px-6 py-2.5 cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                pathname === item.href ? 'bg-[#0063b4]/8 text-zinc-900 border-r-2 border-[#0063b4]' : 'text-zinc-50 hover:bg-white hover:text-zinc-900'
            }`}
            >
            <div
                className={`w-1.5 h-1.5 rounded-full mr-4 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                pathname === item.href ? 'bg-[#0063b4]' : 'bg-zinc-300 group-hover:bg-[#0063b4]'
                }`}
            />
            <span className={`flex-1 text-sm font-normal tracking-normal ${pathname === item.href ? 'font-medium' : ''}`}>
                {item.title}
            </span>
            {item.shortcut && (
                <div className="px-1.5 py-0.5 rounded text-xs bg-zinc-100 text-zinc-500 font-medium">{item.shortcut}</div>
            )}
            </div>
        </Link>
        ))}
    </div>
    </div>
);
};

type User = {
id: string;
email: string;
name: string;
role: string;
profileImage?: string;
};

interface SidebarProps {
collapsed: boolean;
toggleSidebar: () => void;
}

export function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
const router = useRouter();
const pathname = usePathname();
const [user, setUser] = useState<User | null>({
    id: '1',
    email: 'admin@ADCapital.com',
    name: 'AD Capital Admin',
    role: 'Administrator',
});

const getFirstName = (fullName: string) => {
    return fullName?.split(' ')[0] || '';
};

const getLastName = (fullName: string) => {
    const parts = fullName?.split(' ') || [];
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
};

const getInitialOpenMenus = () => {
    const initialState = {
    'employee-files': false,
    'payroll-calculation': false,
    'employee-documents': false,
    'administrative-reports': false,
    archive: false,
    simulation: false,
    'application-settings': false,
    };

    if (pathname.startsWith('/employee-files')) {
    initialState['employee-files'] = true;
    } else if (pathname.startsWith('/payroll-calculation')) {
    initialState['payroll-calculation'] = true;
    } else if (pathname.startsWith('/employee-documents')) {
    initialState['employee-documents'] = true;
    } else if (pathname.startsWith('/administrative-reports')) {
    initialState['administrative-reports'] = true;
    } else if (pathname.startsWith('/archive')) {
    initialState.archive = true;
    } else if (pathname.startsWith('/simulation')) {
    initialState.simulation = true;
    } else if (pathname.startsWith('/application-settings')) {
    initialState['application-settings'] = true;
    }

    return initialState;
};

const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(getInitialOpenMenus());

useEffect(() => {
    setOpenMenus(getInitialOpenMenus());
}, [pathname]);

const mainShortcuts = {
    dashboard: { key: 'd', menu: null },
    'employee-files': { key: '1', menu: 'employee-files' },
    'payroll-calculation': { key: '2', menu: 'payroll-calculation' },
    'employee-documents': { key: '3', menu: 'employee-documents' },
    'administrative-reports': { key: '4', menu: 'administrative-reports' },
    archive: { key: '5', menu: 'archive' },
    simulation: { key: '6', menu: 'simulation' },
    'application-settings': { key: '7', menu: 'application-settings' },
};

const toggleMenu = React.useCallback((menu: string) => {
    console.log('Toggling menu:', menu);
    setOpenMenus((prev) => {
    const allClosed = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
    }, {} as Record<string, boolean>);
    return {
        ...allClosed,
        [menu]: !prev[menu],
    };
    });
}, []);

useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'Meta key:', e.metaKey);
    if (e.metaKey || e.ctrlKey) {
        Object.values(mainShortcuts).forEach(({ key, menu }) => {
        if (e.key.toLowerCase() === key) {
            e.preventDefault();
            console.log('Main shortcut triggered:', key, 'for menu:', menu);
            if (menu) {
            toggleMenu(menu);
            } else if (key === 'd') {
            router.push('/dashboard');
            }
        }
        });
    }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
    window.removeEventListener('keydown', handleKeyDown);
    };
}, [router, openMenus, toggleMenu]);

const isActive = (path: string) => {
    return pathname.startsWith(path);
};

return (
    <div
    className={`fixed top-0 left-0 ${collapsed ? 'w-20' : 'w-72'} h-screen bg-white border-r border-zinc-200 flex flex-col z-50 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
    >
    <div className="px-6 py-6 border-b border-zinc-100 bg-white relative">
        <div className="flex items-center justify-center">
        <div className="p-1">
            {collapsed ? (
            <div className="flex justify-center">
                <img src="/logosch.png" alt="PayrollLogo" className="w-6 h-6 object-contain" />
            </div>
            ) : (
            <div className="flex flex-col items-center">
            <div className="text-center">
                <img src="/logosch.png" alt="PayrollLogo" className="w-20 h-auto object-contain" />
            </div>
            <p className='text-xs text-slate-600 font-semibold'>NewLight Academy Payroll</p>
            </div>
            )}
        </div>
        </div>
        <button
        onClick={toggleSidebar}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 bg-white border border-zinc-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-50"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
        {collapsed ? <ChevronRight size={18} className="text-zinc-600" /> : <ChevronLeft size={18} className="text-zinc-600" />}
        </button>
    </div>
    <div className="flex-1 overflow-y-auto bg-[#2772a0] overflow-x-hidden">
        <div className="pt-4">
        <SidebarItem
            href="/dashboard"
            icon={<Home />}
            title="Dashboard"
            isActive={pathname === '/dashboard'}
            shortcut={collapsed ? '' : 'Ctrl + D'}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        </div>
        <div className="mx-6 my-4 h-px bg-zinc-200" />
        <div className="space-y-1">
        <SidebarItem
            href="/employee-files"
            icon={<Users />}
            title="Employee Records"
            isActive={isActive('/employee-files')}
            hasChildren={true}
            isOpen={openMenus['employee-files']}
            onClick={() => toggleMenu('employee-files')}
            shortcut={collapsed ? '' : 'Ctrl + 1'}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        <SidebarSubmenu
            items={[
            { href: '/pages/employee-files/employee-record', title: 'Employee Profile' },
            { href: '/pages/employee-files/salary-advances', title: 'Salary Advances' },
            { href: '/pages/employee-files/consultation', title: 'Employee Profile View' },
            ]}
            isOpen={openMenus['employee-files']}
        />
        <SidebarItem
            href="/payroll-calculation"
            icon={<Calculator />}
            title="Payroll Processing"
            isActive={isActive('/payroll-calculation')}
            hasChildren={true}
            isOpen={openMenus['payroll-calculation']}
            onClick={() => toggleMenu('payroll-calculation')}
            shortcut={collapsed ? '' : 'Ctrl + 2'}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        <SidebarSubmenu
            items={[
            { href: '/payroll-calculation/monthly-variables', title: 'Monthly Variable Elements' },
            { href: '/payroll-calculation/monthly-calculation', title: 'Monthly Payroll' },
            ]}
            isOpen={openMenus['payroll-calculation']}
        />
        <SidebarItem
            href="/employee-documents"
            icon={<FileText />}
            title="Employee Documents"
            isActive={isActive('/employee-documents')}
            hasChildren={true}
            isOpen={openMenus['employee-documents']}
            onClick={() => toggleMenu('employee-documents')}
            shortcut={collapsed ? '' : 'Ctrl + 3'}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        <SidebarSubmenu
            items={[
            { href: '/employee-documents/payslip', title: 'Payslip' },
            { href: '/employee-documents/salary-certificate', title: 'Salary Certificate' },
            { href: '/employee-documents/final-settlement', title: 'Final Settlement' },
            ]}
            isOpen={openMenus['employee-documents']}
        />
        <SidebarItem
            href="/administrative-reports"
            icon={<FileSpreadsheet />}
            title="Administrative Reports"
            isActive={isActive('/administrative-reports')}
            hasChildren={true}
            isOpen={openMenus['administrative-reports']}
            onClick={() => toggleMenu('administrative-reports')}
            shortcut={collapsed ? '' : 'Ctrl + 4'}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        <SidebarSubmenu
            items={[
            { href: '/administrative-reports/payroll-journal', title: 'Payroll Journal' },
            { href: '/administrative-reports/bank-transfer', title: 'Bulk Bank Transfer' },
            { href: '/administrative-reports/nssf-declaration', title: 'NSSF Declaration' },
            { href: '/administrative-reports/paye-tax-statement', title: 'PAYE Tax Statement' },
            ]}
            isOpen={openMenus['administrative-reports']}
        />
        <SidebarItem
            href="/archive"
            icon={<Award />}
            title="Archive"
            isActive={isActive('/archive')}
            hasChildren={true}
            isOpen={openMenus['archive']}
            onClick={() => toggleMenu('archive')}
            shortcut={collapsed ? '' : 'Ctrl + 5'}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        <SidebarSubmenu
            items={[
            { href: '/archive/payslips', title: 'Payslips' },
            { href: '/archive/certificates', title: 'Certificates' },
            { href: '/archive/nssf-declarations', title: 'NSSF Declarations' },
            { href: '/archive/paye-statements', title: 'PAYE Statements' },
            { href: '/archive/payroll-journals', title: 'Payroll Journals' },
            { href: '/archive/final-settlements', title: 'Final Settlements' },
            ]}
            isOpen={openMenus['archive']}
        />
        <SidebarItem
            href="/simulation"
            icon={<TrendingUp />}
            title="Simulation"
            isActive={isActive('/simulation')}
            hasChildren={true}
            isOpen={openMenus['simulation']}
            onClick={() => toggleMenu('simulation')}
            shortcut={collapsed ? '' : 'Ctrl + 6'}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        <SidebarSubmenu
            items={[
            { href: '/simulation/salary-simulation', title: 'Salary Simulation' },
            { href: '/simulation/family-tax-impact', title: 'Family/Tax Impact' },
            { href: '/simulation/regularization-recall', title: 'Regularization/Recall' },
            { href: '/simulation/housing-loan', title: 'Housing Loan' },
            ]}
            isOpen={openMenus['simulation']}
        />
        </div>
        <div className="mx-6 my-4 h-px bg-zinc-200" />
        <div className="space-y-1 pb-6">
        <SidebarItem
            href="/application-settings"
            icon={<Settings />}
            title="Application Settings"
            isActive={isActive('/application-settings')}
            hasChildren={true}
            isOpen={openMenus['application-settings']}
            onClick={() => toggleMenu('application-settings')}
            shortcut={collapsed ? '' : 'Ctrl + 7'}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        <SidebarSubmenu
            items={[
            { href: '/application-settings/social-tax-scales', title: 'NHIF, NSSF, and PAYE Scales' },
            { href: '/application-settings/thresholds-reductions', title: 'Thresholds, Reductions, Professional Expenses' },
            { href: '/application-settings/housing-loan', title: 'Housing Loan' },
            ]}
            isOpen={openMenus['application-settings']}
        />
        </div>
    </div>
    {/* <SidebarFooter/> */}
        <div className="flex items-center justify-center my-1 py-2">{/* border-t border-zinc-100 */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "space-x-2"}`}>
        <Circle className="w-2 h-2 text-green-500 fill-current" />
        {!collapsed && <p className="text-xs text-zinc-500 font-medium">© 2025 NewLight Academy</p>}
        </div>
    </div>
    </div>
);
}