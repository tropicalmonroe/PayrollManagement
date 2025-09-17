import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { RouteAccessMap } from './lib/context';

const routeAccessMap = RouteAccessMap;

// Define matchers for all routes
const matchers = Object.keys(routeAccessMap).map(route => ({
matcher: createRouteMatcher([route]),
allowedRoles: routeAccessMap[route],
}));

export default clerkMiddleware(async (auth, req) => {
const { sessionClaims, userId } = await auth();
const currentPath = req.nextUrl.pathname;

// 1. Handle unauthenticated users
if (!userId) {
    // Allow access to sign-in and sign-up pages to prevent a redirect loop
    if (currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up')) {
    return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/sign-in', req.url));
}

// 2. Determine user role and primary dashboard
const role = (sessionClaims?.metadata as { role?: string })?.role || 'VIEWER';
const primaryDashboard = (role === 'ADMIN') ? '/dashboard/admin' : '/dashboard';

// 3. Handle unauthorized access to protected routes
for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req)) {
    if (!allowedRoles.includes(role)) {
        console.log(`User with role '${role}' attempted to access '${currentPath}'. Redirecting to ${primaryDashboard}.`);
        return NextResponse.redirect(new URL(primaryDashboard, req.url));
    }
    }
}

// 4. Handle a special redirect for the root dashboard
// This ensures that an ADMIN is always redirected to /dashboard/admin
if (currentPath === '/dashboard' && role === 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard/admin', req.url));
}

// 5. Allow the request to proceed if all checks pass
return NextResponse.next();
});

export const config = {
matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
],
};