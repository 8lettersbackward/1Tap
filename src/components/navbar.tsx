"use client";

import Link from "next/link";
import { useUser, useAuth, useDatabase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { Menu, X, User as UserIcon, Hexagon, Radar, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";

export function Navbar() {
  const { user } = useUser();
  const auth = useAuth();
  const rtdb = useDatabase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user && rtdb) {
      const profileRef = ref(rtdb, `users/${user.uid}/profile`);
      get(profileRef).then(snapshot => {
        const profile = snapshot.val();
        setUserRole(profile?.role || 'user');
      });
    } else {
      setUserRole(null);
    }
  }, [user, rtdb]);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const currentEmailPrefix = user?.email ? user.email.split('@')[0] : "User";
  const currentName = user?.displayName || currentEmailPrefix;

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10 h-16">
      <div className="max-w-7xl mx-auto px-6 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 text-primary group">
              <div className="h-10 w-10 neo-flat flex items-center justify-center group-hover:shadow-inner transition-all">
                <Hexagon className="h-5 w-5" />
              </div>
              <span className="font-bold tracking-tighter text-2xl uppercase text-foreground">1TAP</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <div className="flex items-center space-x-6">
                {userRole === 'guardian' && (
                  <Link href="/dashboard?view=guardian">
                    <Button variant="ghost" className="neo-btn h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-foreground hover:text-primary">
                      <Radar className="h-4 w-4 mr-2" /> Track
                    </Button>
                  </Link>
                )}
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-foreground leading-none">{currentName}</span>
                   <Link href="/dashboard" className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary mt-1">
                    HUB
                  </Link>
                </div>
                <Link href="/profile">
                   <div className="h-10 w-10 neo-btn flex items-center justify-center text-foreground hover:text-primary">
                     <UserIcon className="h-5 w-5" />
                   </div>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="neo-btn h-10 px-6 text-[10px] font-bold uppercase tracking-widest text-foreground">
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-foreground hover:text-primary">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="neo-btn h-11 px-8 text-[10px] font-bold uppercase tracking-[0.2em] bg-background text-foreground hover:text-primary">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 h-10 w-10 neo-flat flex items-center justify-center">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full h-[calc(100vh-64px)] bg-background z-[60] p-8 space-y-10 animate-in fade-in slide-in-from-top-4 duration-300">
          {user ? (
            <>
              <div className="pb-8 border-b border-white/10">
                <p className="text-lg font-bold uppercase tracking-widest text-foreground">{currentName}</p>
                <p className="text-xs font-mono text-muted-foreground mt-2">{user.email}</p>
              </div>
              <div className="space-y-8">
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold uppercase tracking-[0.3em] text-foreground">HUB TERMINAL</Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold uppercase tracking-[0.3em] text-foreground">PROFILE</Link>
                {userRole === 'guardian' && (
                  <Link href="/dashboard?view=guardian" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold uppercase tracking-[0.3em] text-primary">TACTICAL TRACK</Link>
                )}
              </div>
              <div className="pt-8 border-t border-white/10">
                <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="w-full text-left text-sm font-bold uppercase tracking-[0.3em] text-destructive">
                  TERMINATE SESSION
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-8 flex flex-col pt-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold uppercase tracking-[0.3em] text-foreground">SIGN IN</Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold uppercase tracking-[0.3em] text-primary">GET STARTED</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
