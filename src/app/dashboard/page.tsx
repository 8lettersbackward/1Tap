"use client";

import { useUser, useDatabase, useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Settings, 
  Bell, 
  Cpu, 
  Smartphone,
  Loader2,
  Trash2,
  LogOut,
  UserPlus,
  Layers,
  PlusSquare,
  Eye,
  Eraser,
  Thermometer,
  Pencil,
  MapPin,
  AlertTriangle,
  Radar,
  ShieldAlert,
  Search,
  Check,
  X,
  ShieldCheck,
  UserCheck,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ref, set, push, remove, update, onChildAdded, off, onValue, get } from "firebase/database";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRtdb } from "@/firebase/database/use-rtdb";
import { reverseGeocode } from "@/ai/flows/reverse-geocode-flow";

const SOSMap = dynamic(() => import("./sos-map"), { 
  ssr: false,
  loading: () => <div className="h-[200px] sm:h-[250px] md:h-[350px] w-full neo-inset animate-pulse flex items-center justify-center text-[10px] font-bold uppercase tracking-widest opacity-40">Initializing Terminal Map...</div>
});

type TabType = 'buddies' | 'nodes' | 'notifications' | 'settings' | 'guardian' | 'my-guardians';

const DEFAULT_BUDDY_GROUPS = ["Family", "Friend", "Close Friend"];

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { auth } = useFirebase();
  const rtdb = useDatabase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('buddies');
  const [hasMounted, setHasMounted] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [buddyForm, setBuddyForm] = useState({ name: '', phoneNumber: '', groups: [] as string[] });
  const [nodeForm, setNodeForm] = useState({ nodeName: '', hardwareId: '', phoneNumber: '', temperature: 24, targetGroups: [] as string[] });

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [activeTrackedNodes, setActiveTrackedNodes] = useState<any[]>([]);
  const [telemetryTargetUid, setTelemetryTargetUid] = useState<string | null>(null);

  const [isAddBuddyDialogOpen, setIsAddBuddyDialogOpen] = useState(false);
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  const [isEditBuddyDialogOpen, setIsEditBuddyDialogOpen] = useState(false);
  const [isEditNodeDialogOpen, setIsEditNodeDialogOpen] = useState(false);
  const [isViewItemDialogOpen, setIsViewItemDialogOpen] = useState(false);
  const [isManageGroupsDialogOpen, setIsManageGroupsDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [itemToView, setItemToView] = useState<any>(null);
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [activeSosAlert, setActiveSosAlert] = useState<any>(null);
  const [isSosMapOpen, setIsSosMapOpen] = useState(false);
  const lastProcessedAlertRef = useRef<string | null>(null);

  const currentName = useMemo(() => user?.email?.split('@')[0] || "Personnel", [user]);

  const isValidCoordinate = (val: any) => {
    if (val === undefined || val === null || val === "No_fix") return false;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return !isNaN(num) && isFinite(num) && num !== 0;
  };

  useEffect(() => {
    setHasMounted(true);
    if (!userLoading) {
      if (!user) {
        router.push("/login");
      } else if (!user.emailVerified) {
        router.push("/verify-email");
      }
    }
    
    if (user && rtdb) {
      const profileRef = ref(rtdb, `users/${user.uid}/profile`);
      get(profileRef).then(snapshot => {
        const profile = snapshot.val();
        const role = profile?.role || 'user';
        setUserRole(role);
        setActiveTab(role === 'guardian' ? 'guardian' : 'buddies');
      });
    }
  }, [user, userLoading, router, rtdb]);

  useEffect(() => {
    if (rtdb && user && user.emailVerified) {
      const usersRef = ref(rtdb, 'users');
      const unsubscribe = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data)
            .filter(([uid]) => uid !== user.uid)
            .map(([uid, val]: [string, any]) => ({
              uid,
              email: val.profile?.email || 'N/A',
              displayName: val.profile?.displayName || (val.profile?.email?.split('@')[0] || 'Unit'),
              role: val.profile?.role || 'user',
              nodes: val.nodes || {}
            }));
          setAllUsers(list);
        }
      });
      return () => off(usersRef, 'value', unsubscribe);
    }
  }, [user, rtdb]);

  const buddiesRef = useMemo(() => user && user.emailVerified ? ref(rtdb, `users/${user.uid}/buddies`) : null, [rtdb, user]);
  const { data: buddiesData } = useRtdb(buddiesRef);

  const nodesRef = useMemo(() => user && user.emailVerified ? ref(rtdb, `users/${user.uid}/nodes`) : null, [rtdb, user]);
  const { data: nodesData } = useRtdb(nodesRef);

  const notificationsRef = useMemo(() => user && user.emailVerified ? ref(rtdb, `users/${user.uid}/notifications`) : null, [rtdb, user]);
  const { data: notificationsData } = useRtdb(notificationsRef);

  const linksRef = useMemo(() => user && user.emailVerified ? ref(rtdb, `users/${user.uid}/links`) : null, [rtdb, user]);
  const { data: linksData } = useRtdb(linksRef);

  useEffect(() => {
    if (!user || !user.emailVerified || !rtdb) return;
    const queryRef = ref(rtdb, `users/${user.uid}/notifications`);
    const unsubscribe = onChildAdded(queryRef, async (snapshot) => {
      const alert = snapshot.val();
      const alertId = snapshot.key;
      if (!alert || alertId === lastProcessedAlertRef.current) return;
      lastProcessedAlertRef.current = alertId;
      if (isValidCoordinate(alert.latitude) && isValidCoordinate(alert.longitude) && !alert.place) {
        try {
          const geo = await reverseGeocode({ latitude: Number(alert.latitude), longitude: Number(alert.longitude) });
          const place = `${geo.city}, ${geo.province}, ${geo.country}`;
          update(ref(rtdb, `users/${user.uid}/notifications/${alertId}`), { place });
        } catch (e) {}
      }
      if (alert.type === "sos" && Date.now() - (alert.createdAt || 0) < 30000 && alert.trigger !== "TrackResponse") {
        setActiveSosAlert({ ...alert, id: alertId });
        setIsSosMapOpen(true);
      }
    });
    return () => off(queryRef, "child_added", unsubscribe);
  }, [user, rtdb]);

  const buddies = useMemo(() => buddiesData ? Object.entries(buddiesData).map(([id, val]: [string, any]) => ({ ...val, id })) : [], [buddiesData]);
  const nodes = useMemo(() => nodesData ? Object.entries(nodesData).map(([id, val]: [string, any]) => ({ ...val, id })) : [], [nodesData]);
  const notifications = useMemo(() => notificationsData ? Object.entries(notificationsData).map(([id, val]: [string, any]) => ({ ...val, id, createdAt: val.createdAt || val.timestamp || 0 })).sort((a, b) => b.createdAt - a.createdAt) : [], [notificationsData]);
  const links = useMemo(() => linksData ? Object.entries(linksData).map(([id, val]: [string, any]) => ({ ...val, uid: id })) : [], [linksData]);

  const handleToggleNodeTrack = (nodeId: string, currentStatus: boolean) => {
    if (!rtdb || !telemetryTargetUid || !user) return;
    const newStatus = !currentStatus;
    update(ref(rtdb, `users/${telemetryTargetUid}/nodes/${nodeId}`), { 
      trackRequest: newStatus,
      trackRequester: newStatus ? user.uid : null 
    });
    toast({ title: newStatus ? "Track Signal Initiated" : "Track Signal Suspended" });
  };

  const logOutTerminal = () => signOut(auth).then(() => router.push("/login"));

  if (userLoading || !hasMounted) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const navItems = userRole === 'guardian' 
    ? [{ id: 'guardian', label: 'TACTICAL RADAR', icon: Radar }, { id: 'notifications', label: 'TELEMETRY', icon: Bell }, { id: 'settings', label: 'PROFILE', icon: Settings }]
    : [{ id: 'buddies', label: 'BUDDIES', icon: Smartphone }, { id: 'nodes', label: 'NODES', icon: Cpu }, { id: 'my-guardians', label: 'GUARDIANS', icon: ShieldCheck }, { id: 'notifications', label: 'TELEMETRY', icon: Bell }, { id: 'settings', label: 'PROFILE', icon: Settings }];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground overflow-x-hidden">
      <aside className="w-full md:w-72 p-6 md:h-screen md:sticky top-0 z-40">
        <div className="space-y-12">
          <div className="flex items-center gap-4 p-6 neo-flat">
            <Avatar className="h-12 w-12 neo-inset">
              <AvatarFallback className="bg-transparent text-primary font-bold">{currentName[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate uppercase tracking-widest">{currentName}</p>
              <p className="text-[8px] opacity-40 uppercase font-bold tracking-[0.2em]">{userRole}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-all text-[10px] font-bold uppercase tracking-[0.2em] relative",
                  activeTab === item.id ? "neo-inset text-primary" : "neo-btn text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
                {notifications.length > 0 && item.id === 'notifications' && (
                  <span className="absolute top-4 right-4 h-2 w-2 bg-primary rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-16 w-full">
        <div className="max-w-6xl mx-auto space-y-12">
          {activeTab === 'guardian' && (
            <div className="space-y-12">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tighter uppercase">Tactical Radar</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Personnel recruitment Hub</p>
              </div>
              <div className="neo-flat p-10 space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-2">Hardware Signature</Label>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Input 
                      placeholder="NODE-XXXX" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-16 neo-inset bg-background text-foreground px-8 flex-1"
                    />
                    <Button onClick={() => {}} className="h-16 px-12 neo-btn bg-background text-foreground uppercase text-[10px] font-bold tracking-widest w-full sm:w-auto">Intercept</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-12">
              <h1 className="text-4xl font-bold tracking-tighter uppercase">Telemetry Vault</h1>
              <div className="neo-flat p-10">
                <ScrollArea className="h-[600px] pr-6">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] opacity-10">
                      <Bell className="h-16 w-16 mb-6" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Vault Clear</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="mb-10 p-8 neo-flat bg-background/50">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4 items-center">
                            {n.type === 'sos' ? <AlertTriangle className="h-5 w-5 text-primary animate-pulse" /> : <Radar className="h-5 w-5 opacity-40" />}
                            <p className="text-sm font-bold uppercase tracking-widest">{n.message}</p>
                          </div>
                          <Badge className="neo-inset bg-transparent text-[8px] text-foreground border-none px-4 py-1 uppercase">{new Date(n.createdAt).toLocaleTimeString()}</Badge>
                        </div>
                        {isValidCoordinate(n.latitude) && (
                          <div className="space-y-6">
                            <div className="neo-inset p-4 space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><MapPin className="h-3 w-3" /> {n.place || 'Coordinates'}</p>
                              <p className="text-[10px] font-mono opacity-40">LAT: {n.latitude} | LNG: {n.longitude}</p>
                            </div>
                            <Button 
                              onClick={() => { setActiveSosAlert(n); setIsSosMapOpen(true); }}
                              className="w-full h-12 neo-btn bg-background text-foreground uppercase text-[10px] font-bold tracking-widest"
                            >
                              View Tactical Map
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-md space-y-12">
              <h1 className="text-4xl font-bold tracking-tighter uppercase">Profile Hub</h1>
              <div className="neo-flat p-12 space-y-10">
                <div className="p-8 neo-inset">
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-4">Identity Details</p>
                  <p className="text-xs font-bold uppercase">{user.email}</p>
                  <p className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em] mt-2">ID: {user.uid}</p>
                </div>
                <Button variant="destructive" onClick={logOutTerminal} className="w-full h-16 neo-btn bg-background text-destructive hover:text-destructive text-sm font-bold uppercase tracking-[0.2em]">
                  <LogOut className="h-5 w-5 mr-3" /> Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isSosMapOpen} onOpenChange={setIsSosMapOpen}>
        <DialogContent className="neo-flat max-w-4xl p-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="p-10 neo-inset m-6 mb-0">
             <div className="flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <Radar className="h-8 w-8 text-primary animate-pulse" />
                  <DialogTitle className="text-xl font-bold uppercase tracking-[0.2em] text-foreground">Tactical Intercept</DialogTitle>
               </div>
               <Badge className="neo-flat bg-background text-foreground uppercase text-[10px] px-6 py-2 border-none font-bold">LIVE SIGNAL</Badge>
             </div>
          </DialogHeader>
          <div className="p-10 space-y-10">
            <div className="neo-inset p-2">
              <SOSMap 
                latitude={activeSosAlert?.latitude || 0} 
                longitude={activeSosAlert?.longitude || 0}
                label={activeSosAlert?.place || 'Target Location'}
              />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="p-6 neo-inset">
                <Label className="text-[10px] font-bold uppercase opacity-40 block mb-2">Spatial Context</Label>
                <p className="text-xs font-bold uppercase break-words">{activeSosAlert?.place || 'Analyzing Signal...'}</p>
              </div>
              <div className="p-6 neo-inset">
                <Label className="text-[10px] font-bold uppercase opacity-40 block mb-2">Coordinates</Label>
                <p className="text-[10px] font-mono font-bold">{activeSosAlert?.latitude}, {activeSosAlert?.longitude}</p>
              </div>
            </div>
            <Button onClick={() => setIsSosMapOpen(false)} className="w-full h-16 neo-btn bg-background text-foreground text-sm font-bold uppercase tracking-[0.3em]">
              CLOSE TERMINAL
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
