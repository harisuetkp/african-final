import { useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Home, Search, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-white to-amber-50">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* Brand-themed 404 */}
                    <div className="space-y-2">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center mb-4">
                            <span className="text-5xl">💔</span>
                        </div>
                        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-amber-600 bg-clip-text text-transparent">404</h1>
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Page Not Found
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Looks like this page took a wrong turn. Let's get you back on track to finding your perfect match!
                        </p>
                    </div>
                    
                    {/* Admin Note */}
                    {isFetched && authData?.isAuthenticated && authData?.user?.role === 'admin' && (
                        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-amber-800">Admin Note</p>
                                    <p className="text-sm text-amber-700">
                                        Page "{pageName}" doesn't exist yet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="pt-6 space-y-3">
                        <Link to={createPageUrl('Home')}>
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2">
                                <Home size={18} />
                                Back to Discovery
                            </Button>
                        </Link>
                        
                        <div className="flex gap-3">
                            <Link to={createPageUrl('Matches')} className="flex-1">
                                <Button variant="outline" className="w-full gap-2">
                                    <Heart size={18} />
                                    Matches
                                </Button>
                            </Link>
                            <Button 
                                variant="outline" 
                                onClick={() => window.history.back()}
                                className="flex-1 gap-2"
                            >
                                <ArrowLeft size={18} />
                                Go Back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}