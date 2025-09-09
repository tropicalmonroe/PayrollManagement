"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
LucideProps
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
toggleSidebar
}) => {
const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && onClick) {
    e.preventDefault();
    
    // If sidebar is collapsed, expand it first and then toggle the menu
    if (collapsed && toggleSidebar) {
        toggleSidebar();
        // We need to delay the menu toggle to ensure the sidebar fully expands first
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
        isActive 
        ? 'bg-[#0063b4]/8 text-gray-900 border-r-3 border-[#0063b4]' 
        : 'hover:bg-gray-50 text-gray-700'
    }`}
    onClick={handleClick}
    >
    {/* Icon */}
    <div className={`${collapsed ? 'mx-auto' : 'mr-4'} transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isActive 
        ? 'text-[#0063b4]' 
        : 'text-gray-500 group-hover:text-[#0063b4]'
    }`}>
        {React.cloneElement(icon as React.ReactElement<LucideProps>, { 
        size: collapsed ? 20 : 18, 
        strokeWidth: 1.5
        })}
    </div>
    
    {/* Text */}
    {!collapsed && (
        <span className={`flex-1 font-normal text-sm tracking-normal leading-tight ${
        isActive 
            ? 'text-gray-900 font-medium' 
            : 'text-gray-700 group-hover:text-gray-900'
        }`}>
        {title}
        </span>
    )}
    
    {/* Keyboard shortcut */}
    {shortcut && !collapsed && (
        <div className="mr-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 font-medium">
        {shortcut}
        </div>
    )}
    
    {/* Chevron for expandable items */}
    {hasChildren && !collapsed && (
        <div className={`ml-2 transition-all duration-200 ${
        isActive ? 'text-[#0063b4]' : 'text-gray-400 group-hover:text-gray-600'
        }`}>
        <ChevronRight 
            size={14} 
            strokeWidth={2}
            className={`transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isOpen ? 'rotate-90' : 'rotate-0'
            }`}
        />
        </div>
    )}
    </div>
);

if (hasChildren) {
    return content;
}

return (
    <Link href={href} passHref>
    {content}
    </Link>
);
}

type SidebarSubmenuProps = {
items: {
    href: string;
    title: string;
    shortcut?: string;
}[];
isOpen: boolean;
};

const SidebarSubmenu: React.FC<SidebarSubmenuProps> = ({ items, isOpen }) => {
const router = useRouter();

return (
    <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
    }`}>
    <div className="bg-gray-50/50 border-l-2 border-gray-100 ml-6">
        {items.map((item, index) => (
        <Link key={item.href} href={item.href} passHref>
            <div 
            className={`group flex items-center px-6 py-2.5 cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                router.pathname === item.href 
                ? 'bg-[#0063b4]/8 text-gray-900 border-r-2 border-[#0063b4]' 
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
            }`}
            >
            {/* Connector dot */}
            <div className={`w-1.5 h-1.5 rounded-full mr-4 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                router.pathname === item.href 
                ? 'bg-[#0063b4]' 
                : 'bg-gray-300 group-hover:bg-[#0063b4]'
            }`} />
            
            <span className={`flex-1 text-sm font-normal tracking-normal ${
                router.pathname === item.href ? 'font-medium' : ''
            }`}>
                {item.title}
            </span>
            
            {/* Keyboard shortcut for submenu item */}
            {item.shortcut && (
                <div className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 font-medium">
                {item.shortcut}
                </div>
            )}
            </div>
        </Link>
        ))}
    </div>
    </div>
);
};

// User type definition
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
const [user, setUser] = useState<User | null>({
    id: '1',
    email: 'admin@AD Capital.com',
    name: 'Administrateur AD Capital',
    role: 'Administrateur'
});

// Get first name and last name from full name
const getFirstName = (fullName: string) => {
    return fullName?.split(' ')[0] || '';
};

const getLastName = (fullName: string) => {
    const parts = fullName?.split(' ') || [];
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
};

// Initialize openMenus state based on current path
const getInitialOpenMenus = () => {
    const initialState = {
    'employee-files': false,
    'payroll-calculation': false,
    'employee-documents': false,
    'administrative-reports': false,
    'archive': false,
    'simulation': false,
    'application-settings': false
    };
    
    // Check current path and open corresponding menu
    const path = router.pathname;
    
    if (path.startsWith('/employee-files')) {
    initialState['employee-files'] = true;
    } else if (path.startsWith('/payroll-calculation')) {
    initialState['payroll-calculation'] = true;
    } else if (path.startsWith('/employee-documents')) {
    initialState['employee-documents'] = true;
    } else if (path.startsWith('/administrative-reports')) {
    initialState['administrative-reports'] = true;
    } else if (path.startsWith('/archive')) {
    initialState['archive'] = true;
    } else if (path.startsWith('/simulation')) {
    initialState['simulation'] = true;
    } else if (path.startsWith('/application-settings')) {
    initialState['application-settings'] = true;
    }
    
    return initialState;
};

const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(getInitialOpenMenus());

// Update open menus when route changes
useEffect(() => {
    setOpenMenus(getInitialOpenMenus());
}, [router.pathname]);

// Define keyboard shortcuts for main menu items
const mainShortcuts = {
    dashboard: { key: 'd', menu: null },
    'employee-files': { key: '1', menu: 'employee-files' },
    'payroll-calculation': { key: '2', menu: 'payroll-calculation' },
    'employee-documents': { key: '3', menu: 'employee-documents' },
    'administrative-reports': { key: '4', menu: 'administrative-reports' },
    'archive': { key: '5', menu: 'archive' },
    'simulation': { key: '6', menu: 'simulation' },
    'application-settings': { key: '7', menu: 'application-settings' }
};

// Memoize the toggleMenu function to avoid recreating it on each render
const toggleMenu = React.useCallback((menu: string) => {
    console.log('Toggling menu:', menu);
    setOpenMenus(prev => {
    // Create a new object with all menus closed
    const allClosed = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
    }, {} as Record<string, boolean>);
    
    // If the menu was already open, just close everything
    // If it was closed, open it and keep everything else closed
    return {
        ...allClosed,
        [menu]: !prev[menu]
    };
    });
}, []);

// Add keyboard event listener
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'Meta key:', e.metaKey);
    
    // Check if Cmd (Meta) key is pressed along with another key
    if (e.metaKey || e.ctrlKey) { // Support both Cmd (Mac) and Ctrl (Windows/Linux)
        // Handle main menu shortcuts
        Object.values(mainShortcuts).forEach(({ key, menu }) => {
        if (e.key.toLowerCase() === key) {
            e.preventDefault();
            console.log('Main shortcut triggered:', key, 'for menu:', menu);
            
            // If it's a menu with children, toggle it
            if (menu) {
            toggleMenu(menu);
            } else if (key === 'd') {
            // Special case for dashboard which doesn't have a submenu
            router.push('/dashboard');
            }
        }
        });
    }
    };
    
    // Add the event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when the component unmounts
    return () => {
    window.removeEventListener('keydown', handleKeyDown);
    };
}, [router, openMenus, toggleMenu]); // Include all dependencies

const isActive = (path: string) => {
    return router.pathname.startsWith(path);
};

return (
    <div className={`fixed top-0 left-0 ${collapsed ? 'w-20' : 'w-72'} h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}>
    {/* Header */}
    <div className="px-6 py-6 border-b border-gray-100 bg-white relative">
        <div className="flex items-center justify-center">
        <div className="p-1">
            {collapsed ? (
            <div className="flex justify-center">
                <img 
                src="/payroll black.png" 
                alt="Payroll Logo" 
                className="w-6 h-6 object-contain"
                />
            </div>
            ) : (
            <div className="text-center">
                <img 
                src="/payroll black.png" 
                alt="Payroll Logo" 
                className="w-20 h-auto object-contain"
                />
            </div>
            )}
        </div>
        </div>
        
        {/* Toggle button - improved visibility and clickability */}
        <button 
        onClick={toggleSidebar}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-50"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
        {collapsed ? (
            <ChevronRight size={18} className="text-gray-600" />
        ) : (
            <ChevronLeft size={18} className="text-gray-600" />
        )}
        </button>
    </div>
    
    {/* Navigation */}
    <div className="flex-1 overflow-y-auto bg-white overflow-x-hidden">
        {/* Dashboard Home */}
        <div className="pt-4">
        <SidebarItem 
            href="/dashboard"
            icon={<Home />}
            title="Tableau de bord"
            isActive={router.pathname === '/dashboard'}
            shortcut={collapsed ? "" : "⌘D"}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        </div>
        
        {/* Divider */}
        <div className="mx-6 my-4 h-px bg-gray-200" />
        
        {/* Navigation sections selon le menu section fourni */}
        <div className="space-y-1">
        {/* 1. Dossier salarié */}
        <SidebarItem 
            href="/employee-files"
            icon={<Users />}
            title="Dossier salarié"
            isActive={isActive('/employee-files')}
            hasChildren={true}
            isOpen={openMenus['employee-files']}
            onClick={() => toggleMenu('employee-files')}
            shortcut={collapsed ? "" : "⌘1"}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        
        <SidebarSubmenu 
            items={[
            { href: '/employee-files/employee-record', title: 'Fiche salarié' },
            { href: '/employee-files/salary-advances', title: 'Avances sur salaire' },
            { href: '/employee-files/consultation', title: 'Consultation fiche salarié' }
            ]}
            isOpen={openMenus['employee-files']}
        />

        {/* 2. Calcul de la paie */}
        <SidebarItem 
            href="/payroll-calculation"
            icon={<Calculator />}
            title="Calcul de la paie"
            isActive={isActive('/payroll-calculation')}
            hasChildren={true}
            isOpen={openMenus['payroll-calculation']}
            onClick={() => toggleMenu('payroll-calculation')}
            shortcut={collapsed ? "" : "⌘2"}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        
        <SidebarSubmenu 
            items={[
            { href: '/payroll-calculation/monthly-variables', title: 'Éléments variables mensuels' },
            { href: '/payroll-calculation/monthly-calculation', title: 'Calcul mensuel' }
            ]}
            isOpen={openMenus['payroll-calculation']}
        />

        {/* 3. Documents salariés */}
        <SidebarItem 
            href="/employee-documents"
            icon={<FileText />}
            title="Documents salariés"
            isActive={isActive('/employee-documents')}
            hasChildren={true}
            isOpen={openMenus['employee-documents']}
            onClick={() => toggleMenu('employee-documents')}
            shortcut={collapsed ? "" : "⌘3"}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        
        <SidebarSubmenu 
            items={[
            { href: '/employee-documents/payslip', title: 'Bulletin de paie' },
            { href: '/employee-documents/salary-certificate', title: 'Attestation de salaire' },
            { href: '/employee-documents/final-settlement', title: 'Solde de tout compte' }
            ]}
            isOpen={openMenus['employee-documents']}
        />

        {/* 4. Éditions administratives */}
        <SidebarItem 
            href="/administrative-reports"
            icon={<FileSpreadsheet />}
            title="Éditions administratives"
            isActive={isActive('/administrative-reports')}
            hasChildren={true}
            isOpen={openMenus['administrative-reports']}
            onClick={() => toggleMenu('administrative-reports')}
            shortcut={collapsed ? "" : "⌘4"}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        
        <SidebarSubmenu 
            items={[
            { href: '/administrative-reports/payroll-journal', title: 'Journal de paie' },
            { href: '/administrative-reports/bank-transfer', title: 'Virement de masse' },
            { href: '/administrative-reports/cnss-declaration', title: 'Déclaration CNSS' },
            { href: '/administrative-reports/igr-tax-statement', title: 'État fiscal IGR' }
            ]}
            isOpen={openMenus['administrative-reports']}
        />

        {/* 5. Coffre */}
        <SidebarItem 
            href="/archive"
            icon={<Award />}
            title="Coffre"
            isActive={isActive('/archive')}
            hasChildren={true}
            isOpen={openMenus['archive']}
            onClick={() => toggleMenu('archive')}
            shortcut={collapsed ? "" : "⌘5"}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        
        <SidebarSubmenu 
            items={[
            { href: '/archive/payslips', title: 'Bulletins de paie' },
            { href: '/archive/certificates', title: 'Attestations' },
            { href: '/archive/cnss-declarations', title: 'Déclarations CNSS' },
            { href: '/archive/igr-statements', title: 'États fiscaux IGR' },
            { href: '/archive/payroll-journals', title: 'Journaux de paie' },
            { href: '/archive/final-settlements', title: 'Soldes de tout compte' }
            ]}
            isOpen={openMenus['archive']}
        />

        {/* 6. Simulation */}
        <SidebarItem 
            href="/simulation"
            icon={<TrendingUp />}
            title="Simulation"
            isActive={isActive('/simulation')}
            hasChildren={true}
            isOpen={openMenus['simulation']}
            onClick={() => toggleMenu('simulation')}
            shortcut={collapsed ? "" : "⌘6"}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        
        <SidebarSubmenu 
            items={[
            { href: '/simulation/salary-simulation', title: 'Simulation salaire' },
            { href: '/simulation/family-tax-impact', title: 'Impact familial/fiscal' },
            { href: '/simulation/regularization-recall', title: 'Régularisation / rappel' },
            { href: '/simulation/housing-credit', title: 'Crédit logement' }
            ]}
            isOpen={openMenus['simulation']}
        />
        </div>
        
        {/* Divider */}
        <div className="mx-6 my-4 h-px bg-gray-200" />
        
        {/* 7. Paramètres applicatifs */}
        <div className="space-y-1 pb-6">
        <SidebarItem 
            href="/application-settings"
            icon={<Settings />}
            title="Paramètres applicatifs"
            isActive={isActive('/application-settings')}
            hasChildren={true}
            isOpen={openMenus['application-settings']}
            onClick={() => toggleMenu('application-settings')}
            shortcut={collapsed ? "" : "⌘7"}
            collapsed={collapsed}
            toggleSidebar={toggleSidebar}
        />
        
        <SidebarSubmenu 
            items={[
            { href: '/application-settings/social-tax-scales', title: 'Barèmes sociaux et fiscaux' },
            { href: '/application-settings/thresholds-reductions', title: 'Plafonds, réductions, frais professionnels' },
            { href: '/application-settings/housing-credit', title: 'Crédit logement' }
            ]}
            isOpen={openMenus['application-settings']}
        />
        </div>
    </div>
    
    {/* Footer with Profile */}
    <div className="px-4 py-4 border-t border-gray-100 bg-white">
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-colors duration-150`}>
            <Avatar className="h-12 w-12 border border-gray-200 overflow-hidden">
                <AvatarFallback className="bg-[#0063b4] text-white text-sm font-medium">
                {user ? `${getFirstName(user.name).charAt(0)}${getLastName(user.name).charAt(0)}` : 'TA'}
                </AvatarFallback>
            </Avatar>
            {!collapsed && (
                <>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                    {user ? user.name : 'AD Capital Admin'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                    {user ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'Administrateur'}
                    </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </>
            )}
            </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Mon compte
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => router.push('/profile')}>
            <User className="mr-3 h-4 w-4" />
            <span>Paramètres du profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
            className="cursor-pointer text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
                // Handle logout
                router.push('/');
            }}
            >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Déconnexion</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Status indicator */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-100">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-2'}`}>
            <Circle className="w-2 h-2 text-green-500 fill-current" />
            {!collapsed && (
            <p className="text-xs text-gray-500 font-medium">
                © 2025 AD Capital
            </p>
            )}
        </div>
        </div>
    </div>
    </div>
);
}
